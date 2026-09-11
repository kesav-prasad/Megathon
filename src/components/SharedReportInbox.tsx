import React, { useState, useEffect, useRef } from 'react';
import { Mail, Printer, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export interface SharedReport {
  id: string;
  senderId: string;
  senderRole: string;
  recipientId: string;
  title: string;
  htmlContent: string;
  timestamp: string;
}

export const shareReport = (recipientId: string, title: string, htmlContent: string, senderProfile: any) => {
  const existing = JSON.parse(localStorage.getItem('PHARMAX_SHARED_REPORTS') || '[]');
  const newReport: SharedReport = {
    id: `shr_${Date.now()}`,
    senderId: senderProfile.user_id,
    senderRole: senderProfile.role,
    recipientId: recipientId.trim().toLowerCase().replace(/^(distributor|pharmacy|manufacturer)$/, 'demo-$1'),
    title,
    htmlContent,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('PHARMAX_SHARED_REPORTS', JSON.stringify([newReport, ...existing]));
  
  // Also send a notification to the recipient
  const notifsKey = `sys_notifications_${newReport.recipientId}`;
  const existingNotifs = JSON.parse(localStorage.getItem(notifsKey) || '[]');
  existingNotifs.push({
    id: Date.now().toString(),
    title: 'New Report Received',
    message: `${senderProfile.role.toUpperCase()} sent you a report: ${title}`,
    date: new Date().toISOString(),
    read: false,
    type: 'system'
  });
  localStorage.setItem(notifsKey, JSON.stringify(existingNotifs));
  // Dispatch storage event to trigger cross-tab sync
  window.dispatchEvent(new Event('storage'));
};

const SharedReportInbox = () => {
  const { profile } = useAuth();
  const [inbox, setInbox] = useState<SharedReport[]>([]);
  const [sentReports, setSentReports] = useState<SharedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SharedReport | null>(null);

  useEffect(() => {
    if (!profile) return;
    
    const fetchInbox = () => {
      const all = JSON.parse(localStorage.getItem('PHARMAX_SHARED_REPORTS') || '[]');
      const myReports = all.filter((r: SharedReport) => r.recipientId === profile.user_id.toLowerCase());
      const mySent = all.filter((r: SharedReport) => r.senderId === profile.user_id);
      setInbox(myReports);
      setSentReports(mySent);
    };

    fetchInbox();
    window.addEventListener('storage', fetchInbox);
    const interval = setInterval(fetchInbox, 3000);
    return () => {
      window.removeEventListener('storage', fetchInbox);
      clearInterval(interval);
    };
  }, [profile]);


  if (inbox.length === 0 && sentReports.length === 0) return null;

  return (
    <div className="mb-8 space-y-6">
      {inbox.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Mail className="text-blue-500" />
            <h2 className="text-xl font-bold text-slate-900">Received Reports Inbox</h2>
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{inbox.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inbox.map(report => (
              <div 
                key={report.id} 
                onClick={() => setSelectedReport(report)}
                className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-blue-400 cursor-pointer transition-all flex justify-between items-start"
              >
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase mb-1">From: {report.senderId} ({report.senderRole})</p>
                  <h3 className="font-bold text-slate-800">{report.title}</h3>
                  <p className="text-xs text-slate-500 mt-2">{new Date(report.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sentReports.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Printer className="text-emerald-500" />
            <h2 className="text-xl font-bold text-slate-900">My Saved / Sent Reports</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sentReports.map(report => (
              <div 
                key={report.id} 
                onClick={() => setSelectedReport(report)}
                className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm hover:border-emerald-400 cursor-pointer transition-all flex justify-between items-start"
              >
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Sent To: {report.recipientId}</p>
                  <h3 className="font-bold text-slate-800">{report.title}</h3>
                  <p className="text-xs text-slate-500 mt-2">{new Date(report.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-lg">{selectedReport.title}</h3>
                <p className="text-xs text-slate-500">Sent by {selectedReport.senderId} on {new Date(selectedReport.timestamp).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                     // Create a temporary hidden iframe to print just this content perfectly
                     const printWindow = window.open('', '_blank');
                     if (printWindow) {
                       printWindow.document.write(`
                         <html>
                           <head>
                             <title>Print Report</title>
                             <style>
                               body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
                               table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                               th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                               th { background-color: #f8f9fa; }
                             </style>
                           </head>
                           <body>
                             ${selectedReport.htmlContent}
                           </body>
                         </html>
                       `);
                       printWindow.document.close();
                       printWindow.focus();
                       setTimeout(() => {
                         printWindow.print();
                         printWindow.close();
                       }, 250);
                     }
                  }} 
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                >
                  <Printer size={18} /> Print
                </button>
                <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-8 overflow-y-auto bg-white flex-1 report-content-preview">
              <div dangerouslySetInnerHTML={{ __html: selectedReport.htmlContent }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedReportInbox;
