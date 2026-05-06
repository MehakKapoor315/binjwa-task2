import React, { useState, useEffect } from 'react';
import { Filter, CheckCircle, Clock, Info, AlertTriangle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import Modal from '../common/Modal';
import { toast } from 'react-hot-toast';

const AlertCenter = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ severity: '', status: '' });
  const [selectedAlert, setSelectedAlert] = useState(null);

  const fetchAlerts = async (page = 1) => {
    setLoading(true);
    try {
      const { severity, status } = filters;
      let url = `/alerts?page=${page}&limit=10`;
      if (severity) url += `&severity=${severity}`;
      if (status) url += `&status=${status}`;

      const response = await api.get(url);
      setAlerts(response.data.data);
      setPagination({
        page: response.data.pagination.page,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.pages
      });
    } catch (error) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(1);
  }, [filters]);

  const markAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await api.patch(`/alerts/${id}/read`);
      setAlerts(alerts.map(a => a._id === id ? { ...a, status: 'read' } : a));
      toast.success('Alert marked as read');
    } catch (error) {
      toast.error('Failed to update alert');
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="text-danger" size={20} />;
      case 'warning': return <AlertTriangle className="text-warning" size={20} />;
      case 'info': return <Info className="text-blue-400" size={20} />;
      default: return <Info className="text-text-muted" size={20} />;
    }
  };

  const getSeverityBadge = (severity) => {
    const base = "badge text-[10px]";
    if (severity === 'critical') return `${base} bg-danger/10 text-danger border-danger/30`;
    if (severity === 'warning') return `${base} bg-warning/10 text-warning border-warning/30`;
    return `${base} bg-blue-500/10 text-blue-400 border-blue-500/30`;
  };

  return (
    <div className="container animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-heading font-bold text-white mb-0">Alert Center</h1>
        
        <div className="flex items-center gap-3">
          <select 
            className="input-field py-2 text-sm max-w-[150px]"
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
          <select 
            className="input-field py-2 text-sm max-w-[150px]"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <button 
            onClick={() => setFilters({ severity: '', status: '' })}
            className="btn btn-outline py-2 px-3"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="glass overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <p className="text-text-muted">Fetching alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-20 text-center">
            <CheckCircle size={48} className="mx-auto text-success/40 mb-4" />
            <h3 className="text-xl text-white font-medium">All caught up!</h3>
            <p className="text-text-muted">No alerts matching your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-white">
            {alerts.map((alert) => (
              <div 
                key={alert._id}
                onClick={() => setSelectedAlert(alert)}
                className={`p-5 flex items-start gap-4 cursor-pointer transition-all hover:bg-white/5 ${alert.status === 'unread' ? 'bg-primary/5' : ''}`}
              >
                <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={getSeverityBadge(alert.severity)}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="text-white font-medium">{alert.type.replace(/_/g, ' ')}</h4>
                  <p className="text-text-muted text-sm line-clamp-1">{alert.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  {alert.status === 'unread' && (
                    <button 
                      onClick={(e) => markAsRead(alert._id, e)}
                      className="p-2 hover:bg-success/20 rounded-full transition-colors text-success"
                      title="Mark as read"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  {alert.status === 'unread' && (
                    <div className="w-2 h-2 rounded-full bg-primary pulse-primary"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-top border-border-white flex items-center justify-between">
            <p className="text-xs text-text-muted">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={pagination.page === 1}
                onClick={() => fetchAlerts(pagination.page - 1)}
                className="btn btn-outline p-2 disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                disabled={pagination.page === pagination.totalPages}
                onClick={() => fetchAlerts(pagination.page + 1)}
                className="btn btn-outline p-2 disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      <Modal 
        isOpen={!!selectedAlert} 
        onClose={() => setSelectedAlert(null)}
        title={selectedAlert?.type.replace(/_/g, ' ')}
      >
        {selectedAlert && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className={getSeverityBadge(selectedAlert.severity)}>
                {selectedAlert.severity} severity
              </span>
              <span className="text-sm text-text-muted">
                {new Date(selectedAlert.createdAt).toLocaleString()}
              </span>
            </div>
            
            <div className="bg-bg-deep/50 rounded-xl p-5 border border-border-white">
              <p className="text-white leading-relaxed">{selectedAlert.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl border border-border-white bg-white/5">
                <p className="text-text-muted mb-1 text-xs uppercase tracking-wider">Related To</p>
                <p className="text-white font-medium">{selectedAlert.entity_type}</p>
              </div>
              <div className="p-4 rounded-xl border border-border-white bg-white/5">
                <p className="text-text-muted mb-1 text-xs uppercase tracking-wider">Status</p>
                <p className={`font-medium ${selectedAlert.status === 'unread' ? 'text-primary' : 'text-success'}`}>
                  {selectedAlert.status.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              {selectedAlert.status === 'unread' && (
                <button 
                  onClick={() => {
                    markAsRead(selectedAlert._id);
                    setSelectedAlert(null);
                  }}
                  className="btn btn-primary"
                >
                  Mark as Read & Close
                </button>
              )}
              <button 
                onClick={() => setSelectedAlert(null)}
                className="btn btn-outline ml-3"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AlertCenter;
