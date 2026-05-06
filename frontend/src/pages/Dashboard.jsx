import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import NDAModal from '../components/NDA/NDAModal';
import { LayoutDashboard, ShieldAlert, FileText, Database, User as UserIcon, LogOut, UserPlus, Check, X, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AccessRequestsList = ({ api }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const { data: response } = await api.get('/v1/access-requests');
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        const actionName = status === 'approved' ? 'approve' : 'reject';
        const reason = window.prompt(`Please provide a reason to ${actionName} this request:`);

        if (!reason || reason.trim() === '') {
            toast.error('Reason is mandatory for this action');
            return;
        }

        try {
            if (status === 'approved') {
                const { data: eligibleUsersResp } = await api.get('/v1/approvals/users/eligible');
                if (!eligibleUsersResp.data || eligibleUsersResp.data.length === 0) {
                    toast.error('No eligible first approver (Analyst/Admin/Founder) found in system!');
                    return;
                }
                const firstApproverId = eligibleUsersResp.data[0]._id;

                await api.post('/v1/approvals', {
                    action_type: 'approve_user_access',
                    entity_id: id,
                    entity_type: 'access_request',
                    reason: reason.trim(),
                    first_approver_id: firstApproverId
                });
                toast.success('Approval requested created! Check Dual Approvals.');
            } else {
                await api.post(`/v1/access-requests/${id}/reject`, { reason: reason.trim() });
                toast.success('Request rejected');
            }
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        }
    };

    if (loading) return <p className="text-text-muted">Loading requests...</p>;
    if (requests.length === 0) return <p className="text-text-muted italic">No pending requests at this time.</p>;

    return (
        <div className="grid grid-cols-1 gap-4">
            {requests.map((req) => (
                <div key={req._id} className="glass p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-white/5">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-bold mb-0">{req.full_name}</h4>
                            <span className="text-[10px] uppercase tracking-widest bg-white/10 px-2 py-1 rounded border border-white/10">{req.investor_type}</span>
                        </div>
                        <p className="text-sm text-text-muted mb-1">{req.organization} • {req.email}</p>
                        <p className="text-xs text-primary font-medium">Capital Band: {req.capital_band}</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => handleAction(req._id, 'approved')}
                            className="p-2 bg-success/20 text-success rounded-lg border border-success/20 hover:bg-success/30 transition-all"
                        >
                            <Check size={20} />
                        </button>
                        <button 
                            onClick={() => handleAction(req._id, 'rejected')}
                            className="p-2 bg-danger/20 text-danger rounded-lg border border-danger/20 hover:bg-danger/30 transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const Dashboard = () => {
    const { user, ndaSigned, logout, api } = useAuth();
    const [isNdaModalOpen, setIsNdaModalOpen] = useState(false);
    const [sensitiveData, setSensitiveData] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [awaitingCount, setAwaitingCount] = useState(0);

    const fetchSensitiveData = async () => {
        if (!ndaSigned) {
            setIsNdaModalOpen(true);
            return;
        }

        setLoadingData(true);
        try {
            const { data: response } = await api.get('/v1/data');
            setSensitiveData(response.data);
        } catch (error) {
            if (error.response?.status === 403) {
                setIsNdaModalOpen(true);
            } else {
                toast.error('Error fetching intelligence data');
            }
        } finally {
            setLoadingData(false);
        }
    };

    const fetchApprovalsCount = async () => {
        try {
            const { data: response } = await api.get('/v1/approvals/pending');
            // The new response format has a summary object
            const awaitingMineCount = response.data?.summary?.awaiting_my_action || 0;
            setAwaitingCount(awaitingMineCount);
        } catch (error) {
            console.error('Failed to fetch approvals', error);
        }
    };

    useEffect(() => {
        if (ndaSigned) {
            fetchSensitiveData();
        }
    }, [ndaSigned]);

    useEffect(() => {
        if (user) {
            fetchApprovalsCount();
        }
    }, [user]);

    const getRoleBadge = (role) => {
        const classes = {
            Admin: 'badge-admin',
            Investor: 'badge-investor',
            Founder: 'badge-founder',
            Analyst: 'badge-analyst'
        };
        return <span className={`badge ${classes[role] || 'badge-investor'}`}>{role}</span>;
    };

    if (!user) return null;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="glass sticky top-0 z-40 border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                        <LayoutDashboard className="text-primary" size={24} />
                    </div>
                    <h1 className="text-xl font-bold mb-0 tracking-tight">LandVista Portal</h1>
                </div>

                <div className="flex items-center gap-6">
                    <Link to="/approvals" className="relative p-2 text-text-muted hover:text-white transition-colors">
                        <Bell size={20} />
                        {awaitingCount > 0 && (
                            <span className="absolute top-0 right-0 w-4 h-4 bg-danger rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#0f172a]">
                                {awaitingCount}
                            </span>
                        )}
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium">{user.name}</p>
                            <div className="flex gap-2">
                                {getRoleBadge(user.role)}
                                <span className="badge bg-white/10 text-white/60 text-[10px]">{user.tier || 'preview'}</span>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-white/10">
                            <UserIcon className="text-primary" size={20} />
                        </div>
                    </div>
                    <button onClick={logout} className="p-2 text-text-muted hover:text-danger transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="flex-1 container section-spacing">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-12">
                        <h2 className="text-4xl font-extrabold tracking-tight">Welcome, {user.name.split(' ')[0]}</h2>
                        <p className="text-text-muted text-lg mt-3">Governance-locked workspace for {user.role} role.</p>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
                    >
                        <motion.div whileHover={{ y: -5 }} className="glass glass-hover p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
                                    <ShieldAlert size={28} />
                                </div>
                                <h3 className="text-xl font-bold mb-0">NDA Status</h3>
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-3 h-3 rounded-full ${ndaSigned ? 'bg-success pulse-primary' : 'bg-warning animate-pulse'}`}></div>
                                <p className="text-3xl font-extrabold font-heading tracking-tight">{ndaSigned ? 'Verified' : 'Pending'}</p>
                            </div>
                            <p className="text-sm text-text-muted leading-relaxed">
                                {ndaSigned ? 'Legally bound access to intelligence vault.' : 'Action required: Sign latest protocol agreement.'}
                            </p>
                            {!ndaSigned && (
                                <button 
                                    onClick={() => setIsNdaModalOpen(true)}
                                    className="btn btn-primary mt-8 w-full py-4 uppercase tracking-[0.2em] font-bold text-xs"
                                >
                                    Review & Sign NDA
                                </button>
                            )}
                        </motion.div>

                        <motion.div whileHover={{ y: -5 }} className="glass glass-hover p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20">
                                    <Database size={28} />
                                </div>
                                <h3 className="text-xl font-bold mb-0">Identity & Tier</h3>
                            </div>
                            <p className="text-3xl font-extrabold font-heading tracking-tight mb-2 uppercase">{user.role}</p>
                            <div className="flex items-center gap-2 text-text-muted text-sm">
                                <span className="bg-white/5 px-3 py-1 rounded-lg border border-white/10 uppercase tracking-widest text-[10px] font-bold">{user.tier || 'preview'} Tier</span>
                                <span>Active Session</span>
                            </div>
                        </motion.div>

                        <motion.div whileHover={{ y: -5 }} className="glass glass-hover p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 bg-green-500/10 rounded-2xl text-green-400 border border-green-500/20">
                                    <FileText size={28} />
                                </div>
                                <h3 className="text-xl font-bold mb-0">Compliance Logs</h3>
                            </div>
                            <p className="text-3xl font-extrabold font-heading tracking-tight mb-2">Audit Ready</p>
                            <p className="text-sm text-text-muted leading-relaxed">All intelligence access is logged via ISO-8601 timestamps.</p>
                        </motion.div>
                    </motion.div>

                    <div className="glass p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-[100px]"></div>
                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div>
                                <h3 className="text-3xl font-extrabold font-heading tracking-tight mb-2">Intelligence Vault</h3>
                                <p className="text-text-muted">Structured signals and derived intelligence for your role.</p>
                            </div>
                            {ndaSigned && (
                                <button onClick={fetchSensitiveData} className="btn btn-outline text-xs uppercase tracking-widest py-3 px-6">
                                    Refresh Signals
                                </button>
                            )}
                        </div>

                        {!ndaSigned ? (
                            <div className="text-center py-28 bg-black/40 rounded-[40px] border border-dashed border-white/10 relative z-10">
                                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                                    <ShieldAlert size={48} className="text-text-muted opacity-50" />
                                </div>
                                <h4 className="text-3xl font-bold mb-4 font-heading tracking-tight">Access Protocol Restricted</h4>
                                <p className="text-text-muted max-w-lg mx-auto px-10 text-lg leading-relaxed">
                                    To maintain the integrity of our LandVista operations, you must execute the digital Non-Disclosure Agreement before decrypting assets.
                                </p>
                                <button 
                                    onClick={() => setIsNdaModalOpen(true)}
                                    className="btn btn-primary mt-10 px-12 py-5 font-bold uppercase tracking-[0.3em] text-sm shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                                >
                                    Initialize Security Protocol
                                </button>
                            </div>
                        ) : loadingData ? (
                            <div className="text-center py-28">
                                <div className="relative w-20 h-20 mx-auto mb-8">
                                    <div className="absolute inset-0 rounded-full border-4 border-primary/10"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                                </div>
                                <p className="text-text-muted text-lg font-medium tracking-wide">Syncing intelligence feeds...</p>
                            </div>
                        ) : sensitiveData.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                                {sensitiveData.map((item, index) => (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ delay: index * 0.1, duration: 0.5 }}
                                        key={item._id} 
                                        className="p-10 bg-white/[0.02] rounded-[32px] border border-white/5 hover:border-primary/40 hover:bg-white/[0.04] transition-all cursor-default group shadow-sm"
                                    >
                                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 border border-primary/20 group-hover:bg-primary/20 transition-all duration-300">
                                            <FileText size={28} className="text-primary" />
                                        </div>
                                        <h4 className="text-2xl font-bold mb-4 font-heading tracking-tight group-hover:text-primary transition-colors">
                                            {item.title}
                                        </h4>
                                        <p className="text-text-muted leading-relaxed mb-8 text-sm line-clamp-4">{item.content}</p>
                                        <div className="flex flex-wrap gap-3">
                                            {item.allowedRoles.map(r => (
                                                <span key={r} className="text-[10px] uppercase tracking-[0.2em] font-black bg-white/5 px-4 py-1.5 rounded-xl border border-white/5 text-white/30">{r}</span>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-28 bg-black/20 rounded-[40px] border border-white/5">
                                <Database size={56} className="mx-auto text-white/10 mb-6" />
                                <h4 className="text-2xl font-bold mb-3 tracking-tight">Empty Intelligence Feed</h4>
                                <p className="text-text-muted text-lg max-w-sm mx-auto">
                                    No records matching your role and tier were found in the current governance cycle.
                                </p>
                            </div>
                        )}

                        {user.role === 'Admin' && (
                            <div className="mt-16 relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-accent/20 rounded-xl text-accent border border-accent/20">
                                        <UserPlus size={24} />
                                    </div>
                                    <h3 className="text-2xl font-extrabold font-heading tracking-tight mb-0">Pending Access Requests</h3>
                                </div>
                                <AccessRequestsList api={api} />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <NDAModal isOpen={isNdaModalOpen} onClose={() => setIsNdaModalOpen(false)} />
        </div>
    );
};

export default Dashboard;
