import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const LockUnlockButton = ({ entityType, entityId, initialLockData, onStatusChange }) => {
  const { user } = useAuth();
  const [lockData, setLockData] = useState(initialLockData || { locked_by: null, locked_at: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLockData(initialLockData);
  }, [initialLockData]);

  const isLockedByMe = lockData.locked_by?._id === user?._id || lockData.locked_by === user?._id;
  const isLockedByOther = lockData.locked_by && !isLockedByMe;

  const handleLock = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/${entityType}/${entityId}/lock`);
      setLockData({ locked_by: user, locked_at: new Date() });
      onStatusChange && onStatusChange(true, user);
      toast.success('Record locked for editing');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to lock record');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    setLoading(true);
    try {
      await api.post(`/${entityType}/${entityId}/unlock`);
      setLockData({ locked_by: null, locked_at: null });
      onStatusChange && onStatusChange(false, null);
      toast.success('Record unlocked');
    } catch (error) {
      toast.error('Failed to unlock record');
    } finally {
      setLoading(false);
    }
  };

  if (isLockedByOther) {
    return (
      <div className="flex items-center gap-3 bg-danger/10 border border-danger/30 p-3 rounded-xl">
        <ShieldAlert className="text-danger animate-pulse" size={20} />
        <div>
          <p className="text-xs font-bold text-danger uppercase tracking-tighter">Read Only Mode</p>
          <p className="text-xs text-white">Locked by <b className="text-danger">{lockData.locked_by?.name || 'Another User'}</b></p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {lockData.locked_by ? (
        <button 
          onClick={handleUnlock}
          disabled={loading}
          className="btn btn-outline border-danger/30 text-danger hover:bg-danger/10 flex items-center gap-2"
        >
          {loading ? '...' : <><Unlock size={18} /> UNLOCK RECORD</>}
        </button>
      ) : (
        <button 
          onClick={handleLock}
          disabled={loading}
          className="btn btn-primary flex items-center gap-2"
        >
          {loading ? '...' : <><Lock size={18} /> LOCK FOR EDITING</>}
        </button>
      )}
      
      {lockData.locked_by && (
        <div className="text-xs text-text-muted">
          <p className="text-success font-bold uppercase tracking-widest text-[9px]">Status: You are editing</p>
          <p>Locked {new Date(lockData.locked_at).toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
};

export default LockUnlockButton;
