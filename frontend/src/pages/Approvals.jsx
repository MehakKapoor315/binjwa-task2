import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ApprovalModal from '../components/Approvals/ApprovalModal';
import { ShieldCheck, Clock, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Approvals = () => {
    const { user, api } = useAuth();
    const [awaitingMine, setAwaitingMine] = useState([]);
    const [awaitingOther, setAwaitingOther] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApproval, setSelectedApproval] = useState(null);
    const [filter, setFilter] = useState('mine'); // mine, other

    const fetchApprovals = async () => {
        setLoading(true);
        try {
            const { data: response } = await api.get(`/v1/approvals/pending`);
            setAwaitingMine(response.data.awaiting_my_approval || []);
            setAwaitingOther(response.data.awaiting_other || []);
        } catch (error) {
            console.error("Failed to fetch approvals", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovals();
    }, []);

    const getStatusBadge = (status) => {
        switch(status) {
            case 'pending': return <span className="flex items-center gap-1 text-warning bg-warning/10 px-3 py-1 rounded-full text-xs font-bold border border-warning/20"><Clock size={14}/> Pending 1st</span>;
            case 'half_approved': return <span className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/20"><Clock size={14}/> Pending 2nd</span>;
            case 'approved': return <span className="flex items-center gap-1 text-success bg-success/10 px-3 py-1 rounded-full text-xs font-bold border border-success/20"><CheckCircle2 size={14}/> Approved</span>;
            case 'rejected': return <span className="flex items-center gap-1 text-danger bg-danger/10 px-3 py-1 rounded-full text-xs font-bold border border-danger/20"><XCircle size={14}/> Rejected</span>;
            default: return null;
        }
    };

    const renderList = (list) => {
        if (list.length === 0) {
            return (
                <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-white/5">
                    <ShieldCheck size={48} className="mx-auto text-white/20 mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Approvals Found</h3>
                    <p className="text-gray-400">You have no pending approval requests matching this filter.</p>
                </div>
            );
        }

        return (
            <div className="grid gap-4">
                {list.map((req) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={req._id}
                        onClick={() => setSelectedApproval(req)}
                        className="glass p-6 border-white/5 hover:border-primary/30 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 border border-slate-700 rounded-xl"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold capitalize text-white">{req.action_type.replace(/_/g, ' ')}</h3>
                                {getStatusBadge(req.status)}
                            </div>
                            <p className="text-sm text-gray-400 mb-2">Requested by: <span className="text-white">{req.requested_by?.name || 'Unknown'}</span></p>
                            <p className="text-xs text-primary/80 italic border-l-2 border-primary/50 pl-3">"{req.reason}"</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Awaiting Action From</p>
                            <p className="font-bold text-sm bg-slate-800 text-white px-3 py-1 rounded inline-block">
                                {req.awaiting_from === 'me' ? 'Me' : req.awaiting_from === 'first_approver' ? req.first_approver?.name || 'First Approver' : 
                                 req.awaiting_from === 'second_approver' ? req.second_approver?.name || 'Second Approver' : 'Other'}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-2">{new Date(req.created_at || req.createdAt).toLocaleDateString()}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col pb-20 bg-[#0f172a] text-white">
            <header className="sticky top-0 z-40 border-b border-white/10 px-6 py-4 flex items-center justify-between bg-[#0f172a]/90 backdrop-blur">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="p-2 bg-primary/20 rounded-lg">
                        <ShieldCheck className="text-primary" size={24} />
                    </div>
                    <h1 className="text-xl font-bold mb-0 tracking-tight">Dual Approvals</h1>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 max-w-5xl mt-8">
                <div className="flex gap-4 mb-8">
                    <button onClick={() => setFilter('mine')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${filter === 'mine' ? 'bg-primary text-white shadow-lg' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}>
                        Awaiting My Action ({awaitingMine.length})
                    </button>
                    <button onClick={() => setFilter('other')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${filter === 'other' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-gray-400 hover:bg-slate-700'}`}>
                        Awaiting Others ({awaitingOther.length})
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    renderList(filter === 'mine' ? awaitingMine : awaitingOther)
                )}
            </main>

            <ApprovalModal 
                isOpen={!!selectedApproval} 
                onClose={() => setSelectedApproval(null)} 
                approval={selectedApproval}
                api={api}
                currentUserId={user._id}
                onActionComplete={fetchApprovals}
            />
        </div>
    );
};

export default Approvals;
