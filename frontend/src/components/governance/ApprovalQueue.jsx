import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, Users, User, Calendar, MessageSquare, Check, X, 
  AlertCircle, ChevronRight, Globe, Phone, FileText, CheckCircle 
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../common/Modal';
import { toast } from 'react-hot-toast';

const ApprovalQueue = () => {
  const [approvals, setApprovals] = useState({ awaiting_my_approval: [], awaiting_other: [] });
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mine'); // 'mine', 'others', or 'access'
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [selectedAccess, setSelectedAccess] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Role/Tier for access approval
  const [role, setRole] = useState('Investor');
  const [tier, setTier] = useState('preview');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [apprRes, accessRes] = await Promise.all([
        api.get('/approvals/pending'),
        api.get('/access-requests?status=pending')
      ]);
      setApprovals(apprRes.data.data);
      setAccessRequests(accessRes.data.data);
    } catch (error) {
      toast.error('Failed to load governance queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (action) => {
    if (action === 'reject' && !reason.trim()) {
      toast.error('Reason is required for rejection');
      return;
    }

    setSubmitting(true);
    try {
      const approvalId = selectedApproval._id;
      let endpoint = '';
      
      if (action === 'approve') {
        endpoint = selectedApproval.my_role === 'first_approver' 
          ? `/approvals/${approvalId}/first-approve` 
          : `/approvals/${approvalId}/second-approve`;
      } else {
        endpoint = `/approvals/${approvalId}/reject`;
      }

      await api.post(endpoint, { reason });
      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setSelectedApproval(null);
      setReason('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccessDecision = async (action) => {
    if (!reason.trim()) {
      toast.error('Notes are required for vetting');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { reason };
      if (action === 'approve') {
        payload.role = role;
        payload.tier = tier;
      }

      await api.post(`/access-requests/${selectedAccess._id}/${action}`, payload);
      toast.success(`Access ${action}d successfully`);
      setSelectedAccess(null);
      setReason('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-1">Governance Queue</h1>
          <p className="text-text-muted">Manage system approvals and user onboarding.</p>
        </div>
        
        <div className="flex p-1 bg-white/5 rounded-xl border border-border-white overflow-x-auto">
          <button 
            onClick={() => setActiveTab('mine')}
            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeTab === 'mine' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
          >
            Awaiting Me ({approvals.awaiting_my_approval.length})
          </button>
          <button 
            onClick={() => setActiveTab('others')}
            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeTab === 'others' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
          >
            Awaiting Others ({approvals.awaiting_other.length})
          </button>
          <button 
            onClick={() => setActiveTab('access')}
            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeTab === 'access' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
          >
            User Access ({accessRequests.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
      ) : activeTab === 'access' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessRequests.length === 0 ? (
            <div className="glass lg:col-span-3 p-20 text-center">
              <Users size={48} className="mx-auto text-primary/30 mb-4" />
              <p className="text-text-muted">No pending access requests.</p>
            </div>
          ) : (
            accessRequests.map((req) => (
              <div 
                key={req._id}
                onClick={() => setSelectedAccess(req)}
                className="glass p-6 cursor-pointer hover:border-accent/50 hover:translate-y-[-4px] transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest px-2 py-1 bg-accent/10 border border-accent/20 rounded">
                    NEW ONBOARDING
                  </span>
                  <span className="text-[10px] text-text-muted font-bold">{req.investor_type?.toUpperCase()}</span>
                </div>
                <h4 className="text-white font-semibold mb-1">{req.full_name}</h4>
                <p className="text-xs text-text-muted mb-4">{req.organization}</p>
                
                <div className="space-y-2 text-[11px] text-text-muted">
                  <div className="flex items-center gap-2"><Globe size={14} /> {req.geography}</div>
                  <div className="flex items-center gap-2"><Phone size={14} /> {req.phone}</div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border-white text-[10px] font-bold text-accent uppercase flex justify-between items-center group-hover:text-white">
                  <span>VET THIS USER</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeTab === 'mine' ? approvals.awaiting_my_approval : approvals.awaiting_other).length === 0 ? (
            <div className="glass lg:col-span-3 p-20 text-center">
              <ClipboardCheck size={48} className="mx-auto text-success/30 mb-4" />
              <p className="text-text-muted">No pending general approvals.</p>
            </div>
          ) : (
            (activeTab === 'mine' ? approvals.awaiting_my_approval : approvals.awaiting_other).map((approval) => (
              <div 
                key={approval._id}
                onClick={() => activeTab === 'mine' && setSelectedApproval(approval)}
                className={`glass p-6 transition-all group ${activeTab === 'mine' ? 'cursor-pointer hover:border-primary/50 hover:translate-y-[-4px]' : ''}`}
              >
                {/* ... existing approval card content ... */}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-2 py-1 bg-primary/10 border border-primary/20 rounded">
                    {approval.action_type?.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${
                    approval.status === 'half_approved' ? 'bg-warning/10 text-warning border-warning/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}>
                    {approval.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <h4 className="text-white font-semibold mb-4 line-clamp-1">{approval.reason}</h4>
                <div className="space-y-3 text-sm text-text-muted">
                  <div className="flex items-center gap-2"><User size={16} className="text-primary" /> Requester: <b className="text-white">{approval.requested_by?.name}</b></div>
                  <div className="flex items-center gap-2"><Calendar size={16} className="text-primary" /> Created: {new Date(approval.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Access Decision Modal */}
      <Modal isOpen={!!selectedAccess} onClose={() => setSelectedAccess(null)} title="Vet User Access">
        {selectedAccess && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <DetailBox label="Organization" value={selectedAccess.organization} />
              <DetailBox label="Investor Type" value={selectedAccess.investor_type} />
            </div>
            <div className="p-4 rounded-xl bg-bg-deep/50 border border-border-white">
              <p className="text-text-muted text-xs uppercase tracking-widest mb-2 font-bold">Purpose</p>
              <p className="text-white italic">"{selectedAccess.purpose}"</p>
            </div>
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
            <textarea 
              className="input-field min-h-[100px]"
              placeholder="Notes for vetting decision..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => handleAccessDecision('approve')} className="btn btn-primary flex-grow">APPROVE</button>
              <button onClick={() => handleAccessDecision('reject')} className="btn btn-outline border-danger/30 text-danger flex-grow">REJECT</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Approval Modal (Existing) */}
      <Modal isOpen={!!selectedApproval} onClose={() => setSelectedApproval(null)} title="Review Approval Request">
        {selectedApproval && (
          <div className="space-y-6">
            <p className="text-white">{selectedApproval.reason}</p>
            <textarea className="input-field" placeholder="Notes..." value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex gap-4">
              <button onClick={() => handleAction('approve')} className="btn btn-primary flex-grow">APPROVE</button>
              <button onClick={() => handleAction('reject')} className="btn btn-outline text-danger flex-grow">REJECT</button>
            </div>
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

export default ApprovalQueue;
