import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, History, Edit, Lock, Unlock, Eye, ChevronRight, FileText } from 'lucide-react';
import api from '../../services/api';
import ChangeHistoryDrawer from '../governance/ChangeHistoryDrawer';
import { toast } from 'react-hot-toast';

const IntelligenceList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', zone: '', search: '' });
  const [historyConfig, setHistoryConfig] = useState({ isOpen: false, id: null });
  const navigate = useNavigate();

  const fetchIntelligence = async () => {
    setLoading(true);
    try {
      let url = '/intelligence?';
      if (filters.status) url += `status=${filters.status}&`;
      if (filters.search) url += `search=${filters.search}&`;
      
      const response = await api.get(url);
      setData(response.data.data);
    } catch (error) {
      toast.error('Failed to load intelligence data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, [filters.status]);

  return (
    <div className="container animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-1">Market Intelligence</h1>
          <p className="text-text-muted">Proprietary real estate insights and signal tracking.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text"
              placeholder="Search reports..."
              className="input-field py-2 pl-10 text-sm w-[250px]"
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && fetchIntelligence()}
            />
          </div>
          <select 
            className="input-field py-2 text-sm"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
        ) : data.length === 0 ? (
          <div className="glass p-20 text-center">
            <FileText size={48} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted">No intelligence records found.</p>
          </div>
        ) : (
          data.map((item) => (
            <div key={item._id} className="glass p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-primary/30 transition-all">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${item.locked_by ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}>
                  {item.locked_by ? <Lock size={20} /> : <FileText size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 py-0.5 bg-primary/10 border border-primary/20 rounded">
                      {item.zone?.name || 'N/A'}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                      item.status === 'published' ? 'bg-success/10 text-success border-success/30' : 'bg-warning/10 text-warning border-warning/30'
                    }`}>
                      {item.status}
                    </span>
                    {item.locked_by && (
                      <span className="text-[10px] font-bold text-danger flex items-center gap-1">
                        <Lock size={10} /> LOCKED BY {item.locked_by.name?.toUpperCase() || 'SYSTEM'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-heading text-white font-semibold group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-text-muted text-sm line-clamp-1">{item.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setHistoryConfig({ isOpen: true, id: item._id })}
                  className="btn btn-outline p-2"
                  title="View Change History"
                >
                  <History size={18} />
                </button>
                <button 
                  onClick={() => navigate(`/intelligence/${item._id}`)}
                  className={`btn ${item.locked_by ? 'btn-outline border-primary/30 text-primary' : 'btn-primary'} p-2`}
                  title={item.locked_by ? `Locked by ${item.locked_by.name}` : 'Edit Record'}
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => navigate(`/intelligence/${item._id}`)}
                  className="btn btn-outline p-2"
                >
                  <Eye size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ChangeHistoryDrawer 
        isOpen={historyConfig.isOpen}
        onClose={() => setHistoryConfig({ ...historyConfig, isOpen: false })}
        entityType="intelligence"
        entityId={historyConfig.id}
      />
    </div>
  );
};

export default IntelligenceList;
