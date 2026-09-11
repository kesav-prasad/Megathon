import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Flame, LogOut, Menu, ShieldAlert, Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from '../components/NotificationPanel';

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) => {
  const location = useLocation();
  const { signOut } = useAuth();
  
  const navItems = [
    { icon: Flame, label: 'Destruction Workflow', path: '/disposal/destruction' }
  ];

  return (
    <div className={`fixed inset-y-0 left-0 bg-slate-900 text-slate-300 w-64 flex flex-col transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="h-16 flex items-center px-6 bg-slate-950 font-bold text-white tracking-wider gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
          <Flame size={20} className="text-white" />
        </div>
        Pharma Trace
      </div>
      
      <div className="px-6 py-6 border-b border-slate-800">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Role</p>
        <p className="text-sm text-rose-400 font-semibold flex items-center gap-2">
          Disposal Facility
        </p>
      </div>

      <nav className="flex-1 py-6 overflow-y-auto">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  location.pathname === item.path
                    ? 'bg-rose-500/10 text-rose-400 font-medium border border-rose-500/20'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} className={location.pathname === item.path ? 'text-rose-400' : ''} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

const Navbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 w-full">
      <div className="flex items-center gap-2 w-full md:w-auto">
        <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
          <Menu size={24} />
        </button>
      </div>
      
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          <span className="text-sm font-medium text-slate-600">Disposal System Online</span>
        </div>
        <NotificationPanel />
      </div>
    </header>
  );
};

const DisposalLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="md:ml-64 flex-1 flex flex-col relative w-full min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DisposalLayout;
