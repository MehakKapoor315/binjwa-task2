import React, { useState, useEffect } from 'react';
import { X, History, User, Clock, ArrowRight, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const ChangeHistoryDrawer = ({ isOpen, onClose, entityType, entityId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && entityId) {
      const fetchHistory = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/${entityType}/${entityId}/history`);
          setHistory(response.data.data);
        } catch (error) {
          console.error('Error fetching history:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen, entityType, entityId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-bg-deep border-l border-border-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-border-white flex items-center justify-between bg-bg-surface backdrop-blur-md">
              <div className="flex items-center gap-3">
                <History className="text-primary" size={24} />
                <h2 className="text-xl font-heading font-semibold text-white">Record History</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-grow overflow-y-auto p-6 space-y-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-text-muted text-sm">Loading audit trail...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center p-10">
                  <p className="text-text-muted italic">No changes recorded yet.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-primary/20 ml-3 space-y-10">
                  {history.map((change, idx) => (
                    <div key={change._id} className="relative pl-8">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-bg-deep border-2 border-primary"></div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                              {change.changed_by?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{change.changed_by?.name}</p>
                              <p className="text-[10px] text-text-muted flex items-center gap-1">
                                <Clock size={10} /> {new Date(change.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {change.reason && (
                          <div className="bg-white/5 rounded-lg p-3 text-xs text-text-muted flex items-start gap-2 italic">
                            <MessageCircle size={14} className="mt-0.5 shrink-0" />
                            "{change.reason}"
                          </div>
                        )}

                        <div className="space-y-3">
                          {Object.entries(change.old_value).map(([field, oldVal]) => {
                            const newVal = change.new_value[field];
                            if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return null;
                            
                            return (
                              <div key={field} className="glass bg-white/5 p-3 rounded-lg text-xs">
                                <p className="text-[10px] font-bold text-primary uppercase mb-2">{field.replace(/_/g, ' ')}</p>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 line-through text-danger/60 truncate" title={String(oldVal)}>
                                    {String(oldVal) || 'empty'}
                                  </div>
                                  <ArrowRight size={14} className="text-text-muted shrink-0" />
                                  <div className="flex-1 text-success font-medium truncate" title={String(newVal)}>
                                    {String(newVal) || 'empty'}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChangeHistoryDrawer;
