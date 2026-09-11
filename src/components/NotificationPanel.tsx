import React, { useState, useEffect, useRef } from 'react';
import { Bell, Package, FileText, Activity, X, Truck, ShieldCheck, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getLocalReturns } from '../data/mockReturnsDb';

const NotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const [dynamicNotifs, setDynamicNotifs] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;

    const fetchNotifications = () => {
      let notifs: any[] = [];
      const userRole = profile.role || 'pharmacy';
      const userId = profile.user_id.toLowerCase();
      const shortId = profile.id.substring(0, 8).toLowerCase();

      // 1. Shared Reports
      const allReports = JSON.parse(localStorage.getItem('PHARMAX_SHARED_REPORTS') || '[]');
      const myReports = allReports.filter((r: any) => r.recipientId === userId);
      myReports.forEach((r: any) => {
        notifs.push({
          id: r.id,
          type: 'report',
          title: 'New Report Received',
          message: `${r.senderRole.toUpperCase()} shared: ${r.title}`,
          timestamp: new Date(r.timestamp),
          icon: <FileText size={16} className="text-blue-500" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-100',
          onClick: () => {
            setIsOpen(false);
            if (userRole === 'pharmacy') navigate('/pharmacy/reports');
            else if (userRole === 'distributor') navigate('/distributor/reports');
            else navigate('/manufacturer/reports');
          }
        });
      });

      // 2. Return Tickets (Status updates)
      const returns = getLocalReturns();
      // Filter returns relevant to this user based on role
      const relevantReturns = returns.filter((r: any) => {
        if (userRole === 'pharmacy') return r.pharmacy_id === profile.id;
        if (userRole === 'distributor') return r.distributor_id === profile.id;
        if (userRole === 'manufacturer') return r.manufacturer_id === profile.id;
        return true;
      });

      relevantReturns.forEach((r: any) => {
        let icon = <Package size={16} className="text-slate-500" />;
        let bgColor = 'bg-slate-50';
        let borderColor = 'border-slate-100';

        if (r.status === 'pending') {
          icon = <Activity size={16} className="text-orange-500" />;
          bgColor = 'bg-orange-50'; borderColor = 'border-orange-100';
        } else if (r.status === 'in_transit') {
          icon = <Truck size={16} className="text-blue-500" />;
          bgColor = 'bg-blue-50'; borderColor = 'border-blue-100';
        } else if (r.status === 'delivered') {
          icon = <CheckCircle size={16} className="text-emerald-500" />;
          bgColor = 'bg-emerald-50'; borderColor = 'border-emerald-100';
        } else if (r.status === 'destroyed') {
          icon = <ShieldCheck size={16} className="text-purple-500" />;
          bgColor = 'bg-purple-50'; borderColor = 'border-purple-100';
        }

        notifs.push({
          id: r.id,
          type: 'return',
          title: `Return ${r.ticket_number}`,
          message: `Status updated to: ${r.status.replace('_', ' ').toUpperCase()}`,
          timestamp: new Date(r.updated_at || r.created_at),
          icon, bgColor, borderColor,
          onClick: () => {
            setIsOpen(false);
            if (userRole === 'pharmacy') navigate('/pharmacy/tracking');
            else if (userRole === 'distributor') navigate('/distributor/tracking');
            else navigate('/manufacturer/returns');
          }
        });
      });

      // 3. System Alerts
      const sysNotifs = JSON.parse(localStorage.getItem(`sys_notifications_${shortId}`) || '[]');
      sysNotifs.forEach((sys: any) => {
        notifs.push({
          id: sys.id,
          type: 'system',
          title: sys.title || 'System Alert',
          message: sys.message || sys.text,
          timestamp: new Date(sys.date || sys.created_at || Date.now()),
          icon: <Bell size={16} className="text-slate-500" />,
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-100',
          onClick: () => setIsOpen(false)
        });
      });

      // Sort by newest first
      notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setDynamicNotifs(notifs);
      setUnreadCount(notifs.length > 0 ? (notifs.length > 5 ? 5 : notifs.length) : 0);
    };

    fetchNotifications();
    window.addEventListener('storage', fetchNotifications);
    const interval = setInterval(fetchNotifications, 5000);
    
    return () => {
      window.removeEventListener('storage', fetchNotifications);
      clearInterval(interval);
    };
  }, [profile, navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[85vh]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Bell size={16} className="text-blue-500" /> 
              Dynamic Activity Feed
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          
          <div className="overflow-y-auto flex-1 p-3 custom-scrollbar">
            {dynamicNotifs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell size={32} className="mx-auto mb-2 text-slate-300 opacity-50" />
                <p>No new activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dynamicNotifs.slice(0, 20).map((n) => (
                  <div 
                    key={n.id} 
                    onClick={n.onClick}
                    className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${n.bgColor} ${n.borderColor}`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1 flex-shrink-0 bg-white p-1.5 rounded-full shadow-sm">
                        {n.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{n.title}</p>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wider">
                          {n.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
            <button 
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              Close Feed
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
