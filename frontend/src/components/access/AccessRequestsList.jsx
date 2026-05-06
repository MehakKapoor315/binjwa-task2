import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, User, Mail, Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import Modal from '../common/Modal';
import { toast } from 'react-hot-toast';

const AccessRequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'pending', search: '' });
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // For approval
  const [role, setRole] = useState('Investor');
  const [tier, setTier] = useState('preview');

  const fetchRequests = async (page = 1) => {
    setLoading(true);
    try {
      let url = `/access-requests?page=${page}&limit=10&status=${filters.status}`;
      if (filters.search) url += `&search=${filters.search}`;
      
      const response = await api.get(url);
      setRequests(response.data.data);
      if (response.data.meta?.pagination) {
        setPagination({
          page: response.data.meta.pagination.page,
          total: response.data.meta.pagination.total,
          totalPages: response.data.meta.pagination.pages
        });
      }
    } catch (error) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(1);
  }, [filters.status]);

  const handleDecision = async (action) => {
    if (!decisionReason.trim()) {
      toast.error('Reason is required for review');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { reason: decisionReason };
      if (action === 'approve') {
        payload.role = role;
        payload.tier = tier;
      }

      await api.post(`/access-requests/${selectedRequest._id}/${action}`, payload);
      toast.success(`Request ${action}d successfully`);
      setSelectedRequest(null);
      setDecisionReason('');
      fetchRequests(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const base = "badge text-[10px]";
    if (status === 'approved') return `${base} bg-success/10 text-success border-success/30`;
    if (status === 'rejected') return `${base} bg-danger/10 text-danger border-danger/30`;
    return `${base} bg-warning/10 text-warning border-warning/30`;
  };

  return (
    <div className="container animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-heading font-bold text-white mb-0">Access Management</h1>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text"
              placeholder="Search by name/email..."
              className="input-field py-2 pl-10 text-sm w-[250px]"
              onKeyDown={(e) => e.key === 'Enter' && fetchRequests(1)}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select 
            className="input-field py-2 text-sm max-w-[150px]"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="glass overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
        ) : requests.length === 0 ? (
          <div className="p-20 text-center">
            <Clock size={48} className="mx-auto text-text-muted/30 mb-4" />
            <h3 className="text-xl text-white font-medium">No requests found</h3>
            <p className="text-text-muted">No access requests match your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-border-white">
                  <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-widest">User Details</th>
                  <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-widest">Investor Profile</th>
                  <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-widest">Status</th>
                  <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-white">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {req.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{req.full_name}</p>
                          <p className="text-xs text-text-muted">{req.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-white">{req.investor_type}</p>
                      <p className="text-xs text-text-muted">{req.capital_band}</p>
                    </td>
                    <td className="p-4">
                      <span className={getStatusBadge(req.status)}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedRequest(req)}
                        className="btn btn-outline p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination omitted for brevity, same pattern as AlertCenter */}
      </div>

      {/* Access Request Detail Modal */}
      <Modal 
        isOpen={!!selectedRequest} 
        onClose={() => setSelectedRequest(null)}
        title="Access Request Details"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <DetailBox label="Organization" value={selectedRequest.organization} />
              <DetailBox label="Designation" value={selectedRequest.designation} />
              <DetailBox label="Geography" value={selectedRequest.geography} />
              <DetailBox label="Phone" value={selectedRequest.phone} />
            </div>

            <div className="p-4 rounded-xl bg-bg-deep/50 border border-border-white">
              <p className="text-text-muted text-xs uppercase tracking-widest mb-2 font-bold">Purpose</p>
              <p className="text-white leading-relaxed italic">"{selectedRequest.purpose}"</p>
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="pt-6 border-t border-border-white space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Assign Role</label>
                    <select className="input-field py-2" value={role} onChange={(e) => setRole(e.target.value)}>
                      <option value="Investor">Investor</option>
                      <option value="Analyst">Analyst</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Assign Tier</label>
                    <select className="input-field py-2" value={tier} onChange={(e) => setTier(e.target.value)}>
                      <option value="preview">Preview</option>
                      <option value="intelligence">Intelligence</option>
                      <option value="mandate">Mandate</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Review Reason (Required)</label>
                  <textarea 
                    className="input-field min-h-[80px] resize-none"
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="Provide a reason for approval/rejection..."
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => handleDecision('approve')}
                    disabled={submitting}
                    className="btn btn-primary flex-grow"
                  >
                    <CheckCircle size={18} className="mr-2" /> APPROVE & CREATE USER
                  </button>
                  <button 
                    onClick={() => handleDecision('reject')}
                    disabled={submitting}
                    className="btn btn-outline border-danger/30 text-danger flex-grow"
                  >
                    <XCircle size={18} className="mr-2" /> REJECT
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

const DetailBox = ({ label, value }) => (
  <div className="p-3 rounded-xl border border-border-white bg-white/5">
    <p className="text-text-muted mb-1 text-[10px] uppercase tracking-wider font-bold">{label}</p>
    <p className="text-white text-sm font-medium">{value || 'N/A'}</p>
  </div>
);

export default AccessRequestsList;
