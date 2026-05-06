import React, { useState, useEffect } from 'react';
import { Sparkles, Bookmark, Zap, Activity, ShieldCheck, ChevronRight, Globe, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const UserDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ feed: [], saved: [], activity: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [feedRes, savedRes, activityRes] = await Promise.all([
          api.get('/dashboard/intelligence-feed'),
          api.get('/dashboard/saved-intelligence'),
          api.get('/dashboard/activity')
        ]);
        setData({
          feed: feedRes.data.data,
          saved: savedRes.data.data,
          activity: activityRes.data.data
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="container animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div className="glass p-8 mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 text-primary/10 group-hover:text-primary/20 transition-colors">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-heading font-bold text-white mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-text-muted flex items-center gap-2">
            <ShieldCheck size={18} className="text-success" />
            Your <b className="text-white">{user?.tier}</b> tier access is active.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-heading text-white flex items-center gap-2">
                <Globe size={22} className="text-primary" /> Intelligence Feed
              </h3>
              <button className="text-xs text-primary font-bold hover:underline">View All</button>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                [1, 2].map(i => <div key={i} className="glass h-32 animate-pulse"></div>)
              ) : data.feed.length === 0 ? (
                <div className="glass p-10 text-center text-text-muted italic">No new signals detected today.</div>
              ) : (
                data.feed.map(item => (
                  <div key={item._id} className="glass p-5 flex gap-4 glass-hover group">
                    <div className="p-3 bg-white/5 rounded-xl text-primary h-fit"><Zap size={20} /></div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-primary uppercase">{item.zone?.name}</span>
                        <span className="text-[10px] text-text-muted">• {new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-white font-semibold group-hover:text-primary transition-colors">{item.title}</h4>
                      <p className="text-text-muted text-sm line-clamp-1">{item.description}</p>
                    </div>
                    <button className="self-center p-2 text-text-muted hover:text-white transition-colors">
                      <Bookmark size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-heading text-white flex items-center gap-2">
                <Bookmark size={22} className="text-secondary" /> Saved for Later
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.saved.map(item => (
                <div key={item._id} className="glass p-4 bg-secondary/5 border-secondary/20 hover:bg-secondary/10 transition-colors cursor-pointer">
                  <h4 className="text-white text-sm font-semibold mb-1 truncate">{item.title}</h4>
                  <p className="text-xs text-text-muted flex items-center gap-1"><Clock size={10} /> Saved 2 days ago</p>
                </div>
              ))}
              {data.saved.length === 0 && !loading && (
                <div className="md:col-span-2 glass border-dashed p-10 text-center text-text-muted text-sm">
                  Bookmarks will appear here.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Activity */}
        <div className="space-y-8">
          <section className="glass flex flex-col h-fit">
            <div className="p-6 border-b border-border-white">
              <h3 className="text-lg font-heading text-white flex items-center gap-2">
                <Activity size={20} className="text-success" /> Recent Activity
              </h3>
            </div>
            <div className="p-4 space-y-6">
              {data.activity.map((act, idx) => (
                <div key={idx} className="flex gap-3 relative">
                  {idx !== data.activity.length - 1 && <div className="absolute left-2.5 top-7 bottom-0 w-[1px] bg-border-white"></div>}
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center text-success shrink-0 z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{act.action.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">{act.entity_type} • {new Date(act.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              {data.activity.length === 0 && !loading && (
                <div className="py-10 text-center text-text-muted text-xs italic">No recent activity.</div>
              )}
            </div>
          </section>

          {/* Quick Stats Card */}
          <section className="glass bg-gradient-to-br from-primary/20 to-secondary/20 p-6">
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
              <TrendingUp size={16} /> Market Stats
            </h4>
            <div className="space-y-4">
              <StatItem label="Total Reports" value="128" />
              <StatItem label="Active Zones" value="14" />
              <StatItem label="New Signals" value="+12" color="text-success" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ label, value, color = "text-white" }) => (
  <div className="flex justify-between items-center text-xs">
    <span className="text-text-muted font-medium uppercase tracking-tighter">{label}</span>
    <span className={`${color} font-bold`}>{value}</span>
  </div>
);

const Clock = ({ size, className }) => <Activity size={size} className={className} />; // Fallback

export default UserDashboard;
