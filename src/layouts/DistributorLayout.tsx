import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Truck, Store, Package, Users, Activity,
  Bell, Building2, Settings, User, LogOut, Search, Send
} from 'lucide-react';
import ExpiryNotificationBanner from '../components/ExpiryNotificationBanner';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/distributor/dashboard', icon: LayoutDashboard },
    { name: 'Pharmacy Connect', path: '/distributor/pharmacy-connect', icon: Store },
    { name: 'Incoming Stock', path: '/distributor/stock', icon: Package },
    { name: 'Logistics', path: '/distributor/logistics', icon: Truck },
    { name: 'Notifications', path: '/distributor/notifications', icon: Bell },
    { name: 'Profile', path: '/distributor/profile', icon: Building2 },
    { name: 'Settings', path: '/distributor/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 flex items-center gap-3 text-white">
        <div className="bg-indigo-500 p-2 rounded-lg">
          <Truck size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-tight">Global Logistics</h1>
          <p className="text-xs text-indigo-400 font-medium">Distributor Portal</p>
        </div>
      </div>
      
      <div className="px-4 py-2 mb-20">
        <div className="text-xs uppercase text-slate-500 font-semibold mb-2 ml-2">Menu</div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-indigo-500/10 text-indigo-400 font-medium' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className="mt-auto p-4 fixed bottom-0 w-64 bg-slate-900 border-t border-slate-800">
        <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">Global Logistics</p>
              <p className="text-xs text-slate-400 truncate">Distributor</p>
            </div>
          </div>
          <Link to="/" className="flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-300 mt-2 py-2 bg-slate-700/50 rounded-lg transition-colors">
            <LogOut size={16} />
            Logout
          </Link>
        </div>
      </div>
    </div>
  );
};

const Navbar = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 w-96">
        <Search size={18} className="text-slate-400 mr-2" />
        <input 
          type="text" 
          placeholder="Search batches, QR codes..." 
          className="bg-transparent border-none outline-none text-sm w-full"
        />
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span className="text-sm font-medium text-slate-600">Distributor System Online</span>
        </div>
        <NotificationPanel />
      </div>
    </header>
  );
};

const DistributorLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col relative">
        <ExpiryNotificationBanner />
        <Navbar />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DistributorLayout;
