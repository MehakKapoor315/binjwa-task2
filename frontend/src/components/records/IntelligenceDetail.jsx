import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Lock, Unlock, Save, ArrowLeft, Clock, History, FileText } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const IntelligenceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const response = await api.get(`/intelligence/${id}`);
        setRecord(response.data.data);
        setFormData(response.data.data);
      } catch (error) {
        toast.error('Failed to fetch record');
        navigate('/intelligence');
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [id, navigate]);

  const handleToggleLock = async () => {
    try {
      const action = record.locked_by ? 'unlock' : 'lock';
      const response = await api.post(`/intelligence/${id}/${action}`, {
        reason: action === 'lock' ? 'Manual governance lock' : 'Unlocking for updates'
      });
      setRecord({ ...record, locked_by: action === 'lock' ? { name: 'You' } : null });
      toast.success(`Record ${action}ed successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lock operation failed');
    }
  };

  const handleSave = async () => {
    try {
      await api.patch(`/intelligence/${id}`, formData);
      toast.success('Record updated successfully');
      setEditing(false);
      setRecord({ ...record, ...formData });
    } catch (error) {
      toast.error('Update failed');
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

  if (!record) return null;

  return (
    <div className="container animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/intelligence')} className="btn btn-outline p-2 flex items-center gap-2">
          <ArrowLeft size={18} /> Back to List
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleToggleLock}
            className={`btn ${record.locked_by ? 'btn-danger' : 'btn-outline'} p-2 flex items-center gap-2`}
          >
            {record.locked_by ? <Unlock size={18} /> : <Lock size={18} />}
            {record.locked_by ? 'Unlock' : 'Lock Record'}
          </button>
          {!editing ? (
            <button 
              disabled={!!record.locked_by}
              onClick={() => setEditing(true)}
              className="btn btn-primary p-2 flex items-center gap-2"
            >
              <Save size={18} /> Edit Mode
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="btn btn-outline p-2">Cancel</button>
              <button onClick={handleSave} className="btn btn-primary p-2">Save Changes</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <FileText size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-heading font-bold text-white">{record.title}</h1>
                <p className="text-text-muted">Intelligence ID: {id}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Description</label>
                {editing ? (
                  <textarea 
                    className="input-field mt-2 min-h-[100px]" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                ) : (
                  <p className="text-white mt-2 leading-relaxed">{record.description}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Analysis Content</label>
                {editing ? (
                  <textarea 
                    className="input-field mt-2 min-h-[300px]" 
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                  />
                ) : (
                  <div className="p-6 rounded-xl bg-bg-deep/50 border border-border-white mt-2">
                    <p className="text-white leading-relaxed">{record.content || 'No detailed content available.'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Shield size={16} className="text-primary" /> Governance Info
            </h3>
            <div className="space-y-4">
              <DetailRow label="Status" value={record.status} color={record.status === 'published' ? 'success' : 'warning'} />
              <DetailRow label="Zone" value={record.zone?.name || 'Global'} />
              <DetailRow label="Created" value={new Date(record.createdAt).toLocaleDateString()} />
              <DetailRow label="Last Updated" value={new Date(record.updatedAt).toLocaleDateString()} />
              <DetailRow label="Locked By" value={record.locked_by?.name || 'Unlocked'} color={record.locked_by ? 'danger' : 'text-muted'} />
            </div>
          </div>

          <div className="glass p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <History size={16} className="text-success" /> Activity
            </h3>
            <div className="space-y-3">
              <p className="text-xs text-text-muted italic">No recent system actions found for this record.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, color = 'text-muted' }) => (
  <div className="flex justify-between items-center py-2 border-b border-border-white/50 last:border-0">
    <span className="text-xs text-text-muted">{label}</span>
    <span className={`text-xs font-bold uppercase ${color === 'success' ? 'text-success' : color === 'warning' ? 'text-warning' : color === 'danger' ? 'text-danger' : 'text-white'}`}>
      {value}
    </span>
  </div>
);

export default IntelligenceDetail;
