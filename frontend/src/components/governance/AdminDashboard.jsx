import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle, Clock, Activity, TrendingUp, RefreshCw, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/dashboard');
      setMetrics(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) return (
    <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
  );

  const MetricCard = ({ title, value, icon: Icon, color, route, subtext }) => (
    <div 
      onClick={() => route && navigate(route)}
      className={`glass p-6 cursor-pointer glass-hover border-l-4 border-l-${color}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-${color}/10 text-${color}`}>
          <Icon size={24} />
        </div>
        <div className="text-right">
          <p className="text-3xl font-heading font-bold text-white">{value}</p>
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">{title}</p>
        </div>
      </div>
      {subtext && <p className="text-xs text-text-muted italic mt-2">{subtext}</p>}
    </div>
  );

  return (
    <div className="container animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-1">Governance Overview</h1>
          <p className="text-text-muted flex items-center gap-2">
            <Shield size={16} className="text-primary" /> Admin Monitoring Console
          </p>
        </div>
        <button 
          onClick={fetchMetrics}
          className="btn btn-outline p-3 rounded-full hover:rotate-180 transition-transform duration-500"
          title="Refresh Data"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard 
          title="Critical Alerts" 
          value={metrics.critical_alerts_count} 
          icon={AlertCircle} 
          color="danger"
          route="/dashboard/alerts"
          subtext="Action required immediately"
        />
        <MetricCard 
          title="Pending Approvals" 
          value={metrics.pending_approvals_count} 
          icon={CheckCircle} 
          color="warning"
          route="/governance/approvals"
          subtext="Waiting for your review"
        />
        <MetricCard 
          title="SLA Breaches" 
          value={metrics.sla_breaches_today_count} 
          icon={Clock} 
          color="danger"
          subtext="Detected in the last 24h"
        />
        <MetricCard 
          title="Access Requests" 
          value={metrics.pending_access_requests_count} 
          icon={Activity} 
          color="primary"
          route="/admin/access-requests"
          subtext="New users awaiting vetting"
        />
        <MetricCard 
          title="NDA Re-Signs" 
          value={metrics.ndas_needing_resign_count} 
          icon={RefreshCw} 
          color="accent"
          subtext="Stale compliance records"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pipeline Health */}
        <div className="lg:col-span-1 glass p-8 flex flex-col items-center justify-center text-center">
          <h3 className="text-xl font-heading text-white mb-6">Pipeline Health</h3>
          <div className="relative w-48 h-48 mb-6">
            {/* Circular Progress (Simplified SVG) */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
              <circle 
                cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                strokeDasharray={552.92}
                strokeDashoffset={552.92 * (1 - metrics.pipeline_health.score / 100)}
                className="text-primary transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-heading font-bold text-white">{metrics.pipeline_health.score}%</span>
              <span className="text-xs text-text-muted uppercase tracking-widest font-bold">Health Score</span>
            </div>
          </div>
          <div className="space-y-2 w-full">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Total Deals</span>
              <span className="text-white font-bold">{metrics.pipeline_health.total_deals}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Breached Deals</span>
              <span className="text-danger font-bold">{metrics.pipeline_health.breached_deals}</span>
            </div>
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="lg:col-span-2 glass flex flex-col">
          <div className="p-6 border-b border-border-white flex items-center justify-between">
            <h3 className="text-xl font-heading text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-success" />
              Recent System Activity
            </h3>
            <button className="text-xs text-primary hover:underline font-semibold">View All Logs</button>
          </div>
          <div className="flex-grow overflow-y-auto">
            {metrics.recent_audit_logs.length === 0 ? (
              <div className="p-20 text-center text-text-muted italic">No activity logged yet.</div>
            ) : (
              <div className="divide-y divide-border-white">
                {metrics.recent_audit_logs.map((log) => (
                  <div key={log._id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-bg-deep flex items-center justify-center text-xs font-bold text-text-muted border border-border-white">
                        {log.user_id?.role?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">
                          <span className="text-primary">{log.user_id?.name || 'System'}</span> {log.action.replace(/_/g, ' ').toLowerCase()}
                        </p>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider">{log.entity_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-text-muted">{new Date(log.createdAt).toLocaleTimeString()}</p>
                      <p className="text-[10px] text-text-muted">{new Date(log.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
