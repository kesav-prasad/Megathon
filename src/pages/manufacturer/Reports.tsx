import React, { useState, useEffect, useRef } from 'react';
import { FileText, Printer, Download, Plus, Trash2, Share2, Send } from 'lucide-react';
import SharedReportInbox, { shareReport } from '../../components/SharedReportInbox';
import { useAuth } from '../../context/AuthContext';
import { getMfrBatches } from '../../data/manufacturerData';
import type { CustomerData } from './AddCustomer';
import toast from 'react-hot-toast';

interface ReportItem {
  id: string; // random serial
  batchNumber: string;
  medicineName: string;
  tabletId: string;
  quantity: number;
  price: number;
  total: number;
}

const Reports = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  const [reportItems, setReportItems] = useState<ReportItem[]>([]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const { profile } = useAuth();

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('mfr_customers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomers(parsed);
        if (parsed.length > 0) {
          setSelectedCustomerId(parsed[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleAddBatch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const batchId = e.target.value;
    if (!batchId) return;
    
    const batch = getMfrBatches().find(b => b.id === batchId);
    if (!batch) return;

    const newItem: ReportItem = {
      id: `SN-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      batchNumber: batch.batchNumber,
      medicineName: batch.medicineName,
      tabletId: batch.tabletId,
      quantity: 100, // default
      price: batch.mrp,
      total: 100 * batch.mrp
    };

    setReportItems([...reportItems, newItem]);
    e.target.value = ''; // reset dropdown
  };

  const updateQuantity = (index: number, qty: number) => {
    const updated = [...reportItems];
    updated[index].quantity = qty;
    updated[index].total = qty * updated[index].price;
    setReportItems(updated);
  };

  const removeItem = (index: number) => {
    setReportItems(reportItems.filter((_, i) => i !== index));
  };

  const grandTotal = reportItems.reduce((acc, item) => acc + item.total, 0);
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  
  const handleShare = () => {
    if (!recipientId.trim()) return;
    if (!printRef.current || !profile) return;
    

    // Grab the exact HTML of the report
    // Fix for React inputs: explicitly set the value attribute so innerHTML captures it
    const inputs = printRef.current.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        if (input.checked) input.setAttribute('checked', 'checked');
        else input.removeAttribute('checked');
      } else {
        input.setAttribute('value', input.value);
      }
    });
    
    const htmlContent = printRef.current.innerHTML;

    
    shareReport(recipientId, `MFR Report - ${reportDate}`, htmlContent, profile);
    
    toast.success(`Report shared seamlessly to ${recipientId}!`);
    setIsShareModalOpen(false);
    setRecipientId('');
  };

  const handlePrint = () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer first');
      return;
    }
    if (reportItems.length === 0) {
      toast.error('Please add at least one item to the report');
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SharedReportInbox />
      <div className="flex justify-between items-end print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={24} className="text-blue-600" />
            Distribution Reports
          </h1>
          <p className="text-slate-500">Generate distribution reports for customers and export to PDF.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              const id = window.prompt('Enter the unique ID of the recipient to share this report:');
              if (id && id.trim() !== '') {
                const cleanId = id.trim().toLowerCase();
                
                // Add Notification
                const notifsKey = `sys_notifications_${cleanId}`;
                const existingNotifs = JSON.parse(localStorage.getItem(notifsKey) || '[]');
                existingNotifs.unshift({
                  type: 'blue',
                  text: `New Distribution Report shared by ${selectedCustomer?.name || 'Manufacturer'} on ${reportDate}.`
                });
                localStorage.setItem(notifsKey, JSON.stringify(existingNotifs));

                // Add Shared Report
                const reportsKey = `shared_reports_${cleanId}`;
                const existingReports = JSON.parse(localStorage.getItem(reportsKey) || '[]');
                existingReports.unshift({
                  date: reportDate,
                  from: 'Manufacturer',
                  total: grandTotal,
                  items: reportItems.length
                });
                localStorage.setItem(reportsKey, JSON.stringify(existingReports));

                toast.success(`Report securely shared to ID: ${id.trim().toUpperCase()}`);
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-share-2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
            Share via ID
          </button>
          <button 
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Printer size={18} /> Print / Save PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Distributor / Customer</label>
            <select 
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
            >
              <option value="">-- Select Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Report Date</label>
            <input 
              type="date" 
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Add Medicine Batch to Report</label>
          <select 
            onChange={handleAddBatch}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
            defaultValue=""
          >
            <option value="" disabled>-- Select a Batch to Add --</option>
            {getMfrBatches().map(b => (
              <option key={b.id} value={b.id}>{b.medicineName} - {b.batchNumber} (Available: {b.remainingQuantity})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Printable Report Section */}
      <div 
        ref={printRef}
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 print:m-0 print:border-none print:shadow-none print:p-0 printable-area"
      >
        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              .printable-area, .printable-area * {
                visibility: visible;
              }
              .printable-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              .print\\:hidden {
                display: none !important;
              }
            }
          `}
        </style>
        <div className="text-center mb-8 border-b-2 border-slate-900 pb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">ABC Pharma Ltd.</h1>
          <h2 className="text-xl text-slate-600 font-semibold uppercase tracking-widest">Official Distribution Report</h2>
        </div>

        <div className="flex justify-between mb-8">
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Bill To / Distributor</h3>
            {selectedCustomer ? (
              <div className="text-slate-800">
                <p className="font-bold text-lg">{selectedCustomer.name}</p>
                <p>{selectedCustomer.contact}</p>
                <p>{selectedCustomer.location}</p>
                <p>{selectedCustomer.phone}</p>
              </div>
            ) : (
              <p className="text-slate-400 italic">No customer selected</p>
            )}
          </div>
          <div className="text-right">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Report Details</h3>
            <div className="text-slate-800">
              <p><span className="font-semibold">Date:</span> {reportDate}</p>
              <p><span className="font-semibold">Report ID:</span> REP-{Math.floor(Math.random() * 100000)}</p>
            </div>
          </div>
        </div>

        <table className="w-full text-left mb-8">
          <thead className="bg-slate-100 text-slate-800 font-bold border-y-2 border-slate-900">
            <tr>
              <th className="py-3 px-4">Serial Number</th>
              <th className="py-3 px-4">Medicine / Tablet Name</th>
              <th className="py-3 px-4">Batch Name</th>
              <th className="py-3 px-4 text-right">Quantity</th>
              <th className="py-3 px-4 text-right">Price</th>
              <th className="py-3 px-4 text-right">Total</th>
              <th className="py-3 px-4 print:hidden"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {reportItems.map((item, index) => (
              <tr key={index} className="text-slate-700">
                <td className="py-3 px-4 font-mono">{item.id}</td>
                <td className="py-3 px-4 font-medium">{item.medicineName} <span className="text-slate-400 text-sm block">{item.tabletId}</span></td>
                <td className="py-3 px-4 font-mono text-sm">{item.batchNumber}</td>
                <td className="py-3 px-4 text-right">
                  <input 
                    type="number" 
                    value={item.quantity}
                    onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                    className="w-24 text-right bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-md px-3 py-1.5 outline-none print:bg-transparent print:border-none print:p-0 print:appearance-none inline-block shadow-sm"
                  />
                </td>
                <td className="py-3 px-4 text-right">₹{item.price.toFixed(2)}</td>
                <td className="py-3 px-4 text-right font-medium">₹{item.total.toFixed(2)}</td>
                <td className="py-3 px-4 text-center print:hidden">
                  <button onClick={() => removeItem(index)} className="text-slate-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {reportItems.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 italic">No items added to report yet.</td>
              </tr>
            )}
          </tbody>
          <tfoot className="border-t-2 border-slate-900">
            <tr>
              <td colSpan={5} className="py-4 px-4 text-right font-bold text-slate-900 text-lg">Grand Total:</td>
              <td className="py-4 px-4 text-right font-bold text-slate-900 text-lg">₹{grandTotal.toFixed(2)}</td>
              <td className="print:hidden"></td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-16 flex justify-between text-sm text-slate-500 font-medium pt-8 border-t border-slate-200">
          <div>
            <p className="mb-8">Authorized Signatory</p>
            <div className="w-48 border-b-2 border-slate-800"></div>
            <p className="mt-2">ABC Pharma Ltd.</p>
          </div>
          <div className="text-right">
            <p className="mb-8">Distributor Acknowledgement</p>
            <div className="w-48 border-b-2 border-slate-800 inline-block"></div>
            <p className="mt-2">Receiver's Signature</p>
          </div>
        </div>
      </div>
    
      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Share Report via ID</h3>
            <p className="text-sm text-slate-500 mb-6">Enter the exact User ID of the Distributor or Pharmacy to send this report directly to their inbox.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Recipient ID (e.g. demo-distributor)</label>
              <input
                type="text"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                placeholder="Enter ID..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button onClick={() => setIsShareModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={handleShare} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm">
                <Send size={16} /> Send Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
