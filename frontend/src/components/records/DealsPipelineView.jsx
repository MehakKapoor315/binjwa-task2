import React, { useState, useEffect } from 'react';
import { LayoutGrid, List, Plus, DollarSign, User, Calendar, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const STAGES = ['Conversation', 'Qualified', 'Serious', 'Mandate', 'Closed'];

const DealsPipelineView = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const response = await api.get('/deals');
      setDeals(response.data.data);
    } catch (error) {
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const getDealsByStage = (stage) => deals.filter(d => d.status === stage);

  return (
    <div className="container animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-1">Deals Pipeline</h1>
          <p className="text-text-muted">Tracking high-value real estate mandates.</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={20} /> NEW DEAL
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 min-h-[70vh]">
        {STAGES.map((stage) => {
          const stageDeals = getDealsByStage(stage);
          return (
            <div key={stage} className="min-w-[320px] flex-shrink-0 flex flex-col">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  {stage}
                </h3>
                <span className="text-xs bg-white/5 border border-border-white px-2 py-0.5 rounded-full text-text-muted font-bold">
                  {stageDeals.length}
                </span>
              </div>

              <div className="bg-bg-surface/50 border border-border-white rounded-2xl p-4 flex-grow space-y-4">
                {loading ? (
                  <div className="flex justify-center p-10"><div className="animate-spin h-6 w-6 border-b-2 border-primary rounded-full"></div></div>
                ) : stageDeals.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-border-white rounded-xl text-text-muted text-xs">
                    No deals in {stage}
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <DealCard key={deal._id} deal={deal} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DealCard = ({ deal }) => {
  const isOverdue = deal.next_action_date && new Date(deal.next_action_date) < new Date();

  return (
    <div className="glass p-5 border border-border-white/50 hover:border-primary/50 transition-all cursor-pointer group shadow-lg">
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-white font-semibold text-sm group-hover:text-primary transition-colors">{deal.title}</h4>
        {isOverdue && (
          <div className="text-danger flex items-center gap-1 bg-danger/10 px-1.5 py-0.5 rounded text-[9px] font-bold animate-pulse border border-danger/20">
            <AlertCircle size={10} /> OVERDUE
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <DollarSign size={14} className="text-success" />
          <span className="font-bold text-white">₹{deal.value?.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <User size={14} className="text-primary" />
          <span>Owner: {deal.owner?.name || 'Unassigned'}</span>
        </div>
        {deal.next_action_date && (
          <div className={`flex items-center gap-2 text-xs font-medium ${isOverdue ? 'text-danger' : 'text-warning'}`}>
            <Clock size={14} />
            <span>Next: {new Date(deal.next_action_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border-white">
        <div className="flex -space-x-2">
          {[1, 2].map(i => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-bg-deep bg-primary/20 flex items-center justify-center text-[8px] font-bold text-white">
              S{i}
            </div>
          ))}
        </div>
        <button className="text-[10px] font-bold text-primary hover:text-white uppercase tracking-wider">Details →</button>
      </div>
    </div>
  );
};

export default DealsPipelineView;
