import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShieldAlert, Settings, FileText, Database, 
  User as UserIcon, LogOut, CheckSquare, Bell, Menu, X 
} from 'lucide-react';
import UnreadBadge from '../governance/UnreadBadge';
import NDAAcceptanceModal from '../access/NDAAcceptanceModal';

const MainLayout = ({ children }) => {
  const { user, ndaSigned, logout, signNDA } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['Admin', 'Founder', 'Investor', 'Analyst'] },
    { label: 'Alert Center', icon: Bell, path: '/dashboard/alerts', roles: ['Admin', 'Founder', 'Investor', 'Analyst'] },
    { label: 'Intelligence', icon: FileText, path: '/intelligence', roles: ['Admin', 'Founder', 'Analyst'] },
    { label: 'Deals Pipeline', icon: Database, path: '/pipeline', roles: ['Admin', 'Founder', 'Analyst'] },
    { label: 'Governance Queue', icon: CheckSquare, path: '/governance/approvals', roles: ['Admin', 'Founder', 'Analyst'] },
    { label: 'Admin Metrics', icon: ShieldAlert, path: '/admin/dashboard', roles: ['Admin', 'Founder'] },
    { label: 'Settings', icon: Settings, path: '/settings/notifications', roles: ['Admin', 'Founder', 'Investor', 'Analyst'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

  const handleNDAAccept = () => {
    // refresh current view
    window.location.reload();
  };

  const handleNDADecline = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg-deep flex">
      {/* Sidebar - Desktop */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 glass border-r-0 rounded-none transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <ShieldAlert size={24} />
            </div>
            <span className="text-xl font-heading font-bold text-white tracking-tight">LandVista</span>
          </div>

          <nav className="flex-grow space-y-1">
            {filteredNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  location.pathname === item.path 
                    ? 'bg-primary/20 text-primary border border-primary/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                    : 'text-text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={20} className={location.pathname === item.path ? 'text-primary' : 'group-hover:text-primary transition-colors'} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-border-white">
            <div className="flex items-center gap-3 px-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-border-white flex items-center justify-center">
                <UserIcon size={20} className="text-text-muted" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{user?.role}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-danger hover:bg-danger/10 transition-all font-medium"
            >
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-20 glass border-t-0 border-x-0 rounded-none sticky top-0 z-40 px-6 flex items-center justify-between">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-text-muted hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>

          <div className="hidden lg:block">
             <h2 className="text-lg font-heading font-semibold text-white">
                {navItems.find(n => n.path === location.pathname)?.label || 'Overview'}
             </h2>
          </div>

          <div className="flex items-center gap-4">
            <UnreadBadge />
            <div className="h-8 w-[1px] bg-border-white mx-2"></div>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-border-white">
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Tier:</span>
              <span className="text-xs font-black text-primary uppercase">{user?.tier || 'PREVIEW'}</span>
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-grow overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45 lg:hidden"
        />
      )}

      {/* Global NDA Guard */}
      {user && !ndaSigned && (
        <NDAAcceptanceModal 
          isOpen={true} 
          onAccept={handleNDAAccept} 
          onDecline={handleNDADecline} 
        />
      )}
    </div>
  );
};

export default MainLayout;
