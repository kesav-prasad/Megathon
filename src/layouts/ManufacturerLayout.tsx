import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, PlusCircle, QrCode, 
  Layers, Truck, ScanLine, AlertTriangle, 
  Activity, BarChart3, Bell, Building2, Settings, User, LogOut, Search, FileText, Users, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from '../components/NotificationPanel';
import ExpiryNotificationBanner from '../components/ExpiryNotificationBanner';

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) => {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', path: '/manufacturer/dashboard', icon: LayoutDashboard },
    { name: 'Medicine Batches', path: '/manufacturer/batches', icon: Package },
    { name: 'Add Medicine Batch', path: '/manufacturer/add-batch', icon: PlusCircle },
    { name: 'Add Customer', path: '/manufacturer/add-customer', icon: Users },
    { name: 'Reports', path: '/manufacturer/reports', icon: FileText },
    { name: 'Return Tracking', path: '/manufacturer/returns', icon: Truck },

    { name: 'QR / Barcode Generator', path: '/manufacturer/qr-generator', icon: QrCode },
    { name: 'Inventory & Stock', path: '/manufacturer/inventory', icon: Layers },
    { name: 'Notifications', path: '/manufacturer/notifications', icon: Bell },
    { name: 'Company Profile', path: '/manufacturer/profile', icon: Building2 },
    { name: 'Settings', path: '/manufacturer/settings', icon: Settings },
  ];

  return (
    <div className={`w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-50 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <Building2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">ABC Pharma</h1>
            <p className="text-xs text-blue-400 font-medium">Manufacturer Portal</p>
          </div>
        </div>
        <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
          <X size={24} />
        </button>
      </div>
      
      <div className="px-4 py-2 pb-24">
        <div className="text-xs uppercase text-slate-500 font-semibold mb-2 ml-2">Menu</div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-500/10 text-blue-400 font-medium' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
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
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'Manufacturer'}</p>
              <div className="flex flex-col">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Manufacturer</p>
                <p className="text-[10px] text-blue-400 font-mono truncate">ID: {profile?.id?.substring(0,8).toUpperCase() || 'UNKNOWN'}</p>
              </div>
            </div>
          </div>
          <button onClick={signOut} className="w-full flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-300 mt-2 py-2 bg-slate-700/50 rounded-lg transition-colors">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 w-full">
      <div className="flex items-center gap-2 w-full md:w-auto">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 w-full md:w-96">
          <Search size={18} className="text-slate-400 mr-2 shrink-0" />
          <input 
            type="text" 
            placeholder="Search batches..." 
            className="bg-transparent border-none outline-none text-sm w-full min-w-0"
          />
        </div>
      </div>
      
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-sm font-medium text-slate-600">Manufacturer System Online</span>
        </div>
        <NotificationPanel />
      </div>
    </header>
  );
};

const ManufacturerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="md:ml-64 flex-1 flex flex-col relative w-full min-w-0">
        <ExpiryNotificationBanner />
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManufacturerLayout;
