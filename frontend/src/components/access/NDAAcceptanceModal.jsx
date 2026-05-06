import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, CheckCircle, LogOut, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const NDAAcceptanceModal = ({ isOpen, onAccept, onDecline }) => {
  const [nda, setNda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchNda = async () => {
      try {
        const response = await api.get('/nda/latest');
        setNda(response.data.data);
      } catch (error) {
        console.error('Error fetching NDA:', error);
      } finally {
        setLoading(false);
      }
    };
    if (isOpen) fetchNda();
  }, [isOpen]);

  const handleAccept = async () => {
    if (!accepted || !fullName.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/nda/accept', {
        nda_version_id: nda._id,
        accepted: true,
        fullName
      });
      toast.success('NDA Accepted. Welcome to LandVista!');
      onAccept();
    } catch (error) {
      toast.error('Failed to submit NDA acceptance');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="absolute inset-0 bg-bg-deep/95 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="glass max-w-2xl w-full relative z-[101] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-border-white bg-primary/5 flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-2xl text-primary animate-pulse">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold text-white">Governance & Compliance</h2>
            <p className="text-text-muted text-sm">Non-Disclosure Agreement — Version {nda?.version || '...'}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-8 flex-grow">
          {loading ? (
            <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
          ) : (
            <>
              <section className="space-y-4">
                <h3 className="text-lg font-heading text-white flex items-center gap-2">
                  <FileText size={20} className="text-primary" />
                  NDA Summary
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {nda?.summary_text?.map((point, idx) => (
                    <div key={idx} className="flex gap-3 text-sm text-text-muted bg-white/5 p-3 rounded-lg border border-border-white/50">
                      <CheckCircle size={16} className="text-success shrink-0 mt-0.5" />
                      <p>{point}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-bg-deep/50 p-6 rounded-2xl border border-border-white space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Digital Signature (Full Name)</label>
                  <input 
                    type="text"
                    className="input-field text-xl font-heading text-primary"
                    placeholder="Type your full legal name..."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox"
                    className="mt-1 accent-primary h-4 w-4"
                    checked={accepted}
                    onChange={() => setAccepted(!accepted)}
                  />
                  <span className="text-sm text-text-muted group-hover:text-white transition-colors">
                    I acknowledge that I have read the full Non-Disclosure Agreement and agree to be bound by its terms and conditions regarding data privacy and platform usage.
                  </span>
                </label>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-border-white flex gap-4">
          <button 
            onClick={onDecline}
            className="btn btn-outline flex items-center gap-2"
          >
            <LogOut size={18} /> DECLINE & LOGOUT
          </button>
          <button 
            onClick={handleAccept}
            disabled={!accepted || !fullName.trim() || submitting}
            className="btn btn-primary flex-grow font-bold tracking-widest text-lg disabled:opacity-50"
          >
            {submitting ? 'PROCESSING...' : (
              <span className="flex items-center justify-center gap-2">
                ACCEPT & PROCEED <ChevronRight size={20} />
              </span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NDAAcceptanceModal;
