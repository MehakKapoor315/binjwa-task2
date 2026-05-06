import React, { useState, useEffect } from 'react';
import { AlertCircle, X, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const CriticalUpdateCards = () => {
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCriticalAlerts = async () => {
    try {
      const response = await api.get('/alerts?severity=critical&status=unread&limit=3');
      setCriticalAlerts(response.data.data);
    } catch (error) {
      console.error('Error fetching critical alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriticalAlerts();
    // Poll every minute
    const interval = setInterval(fetchCriticalAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const dismissAlert = async (id) => {
    try {
      await api.patch(`/alerts/${id}/read`);
      setCriticalAlerts(criticalAlerts.filter(a => a._id !== id));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  if (loading || criticalAlerts.length === 0) return null;

  return (
    <div className="mb-8 space-y-3">
      <AnimatePresence>
        {criticalAlerts.map((alert) => (
          <motion.div
            key={alert._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden group"
          >
            {/* Animated Glow Border */}
            <div className="absolute inset-0 bg-gradient-to-r from-danger/20 via-danger/5 to-danger/20 animate-pulse"></div>
            
            <div className="glass border-danger/30 bg-danger/5 p-4 flex items-center gap-4 relative z-10">
              <div className="bg-danger/20 p-2 rounded-lg text-danger animate-bounce">
                <AlertCircle size={24} />
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-danger uppercase tracking-widest px-2 py-0.5 bg-danger/10 border border-danger/20 rounded">
                    Critical Update
                  </span>
                  <span className="text-xs text-text-muted">
                    {new Date(alert.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <h3 className="text-white font-semibold text-sm md:text-base">{alert.message}</h3>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => dismissAlert(alert._id)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-white"
                  title="Dismiss"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default CriticalUpdateCards;
