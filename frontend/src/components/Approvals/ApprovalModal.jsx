import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const ApprovalModal = ({ isOpen, onClose, approval, api, onActionComplete, currentUserId }) => {
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !approval) return null;

    const isFirstApprover = approval.my_role === 'first_approver';
    const isSecondApprover = approval.my_role === 'second_approver';
    const isPendingFirst = approval.status === 'pending';
    const isPendingSecond = approval.status === 'half_approved';

    const canApprove = (isFirstApprover && isPendingFirst) || (isSecondApprover && isPendingSecond);
    const canReject = canApprove; 

    const handleApprove = async () => {
        if (isSecondApprover) {
            const confirm = window.confirm("This will execute the final action. Continue?");
            if (!confirm) return;
        }

        setLoading(true);
        try {
            const endpoint = isFirstApprover ? `/v1/approvals/${approval._id}/first-approve` : `/v1/approvals/${approval._id}/second-approve`;
            await api.post(endpoint, { approval_notes: notes, reason: notes || "Approved via UI" });
            toast.success(isFirstApprover ? 'First approval done!' : 'Action executed successfully!');
            onActionComplete();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Approval failed');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        const reason = window.prompt("Please provide a mandatory reason for rejection:");
        if (!reason || reason.trim() === '') {
            toast.error("Rejection reason is mandatory!");
            return;
        }

        setLoading(true);
        try {
            await api.post(`/v1/approvals/${approval._id}/reject`, { reason });
            toast.success('Approval request rejected');
            onActionComplete();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Rejection failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-2xl bg-slate-900 p-8 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-white"
                >
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <h2 className="text-2xl font-bold mb-6 tracking-tight uppercase border-b border-slate-700 pb-4">
                        Approval Request Review
                    </h2>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Action Type</p>
                                <p className="font-bold text-lg capitalize">{approval.action_type.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Requested By</p>
                                <p className="font-bold text-lg">{approval.requested_by?.name || 'Unknown'}</p>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Reason</p>
                            <p className="text-sm italic border-l-2 border-primary/50 pl-3">"{approval.reason}"</p>
                        </div>

                        <div className="flex items-center gap-3 p-4 rounded-xl border border-warning/30 bg-warning/10 text-warning">
                            <Clock size={20} />
                            <span className="font-bold">
                                Status: {approval.status === 'pending' ? '⏳ Pending First Approval' : 
                                         approval.status === 'half_approved' ? '⏳ Pending Second Approval' : 
                                         approval.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                                <span className="text-sm text-gray-400">First Approver:</span>
                                <span className="font-medium flex items-center gap-2">
                                    {approval.first_approver?.name || 'Unassigned'} 
                                    {approval.first_approver?.approved_at && <CheckCircle size={16} className="text-success" />}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                                <span className="text-sm text-gray-400">Second Approver:</span>
                                <span className="font-medium flex items-center gap-2">
                                    {approval.second_approver?.name || '(Will be assigned after first approval)'}
                                    {approval.second_approver?.approved_at && <CheckCircle size={16} className="text-success" />}
                                </span>
                            </div>
                        </div>

                        {canApprove && (
                            <div className="mt-6">
                                <label className="block text-sm font-medium mb-2">My Approval Notes (Optional)</label>
                                <textarea 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm min-h-[100px] focus:outline-none focus:border-primary transition-colors"
                                    placeholder="Add any notes here..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                ></textarea>
                            </div>
                        )}

                        {canApprove && (
                            <div className="flex gap-4 mt-8">
                                <button 
                                    onClick={handleApprove}
                                    disabled={loading}
                                    className="flex-1 bg-success hover:bg-green-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                                >
                                    <CheckCircle size={20} /> Approve
                                </button>
                                <button 
                                    onClick={handleReject}
                                    disabled={loading}
                                    className="flex-1 bg-danger hover:bg-red-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                                >
                                    <XCircle size={20} /> Reject
                                </button>
                            </div>
                        )}
                        {!canApprove && approval.status !== 'approved' && approval.status !== 'rejected' && (
                            <div className="mt-6 p-4 text-center text-gray-400 border border-slate-700 rounded-xl bg-slate-800">
                                You cannot perform actions on this request at this time.
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ApprovalModal;
