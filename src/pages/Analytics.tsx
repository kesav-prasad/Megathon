import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { Download, Sparkles, FileText, Loader2, TrendingUp, Package, AlertTriangle, IndianRupee, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { mockBatches } from '../data/mockData';

const mockSalesData = [
  { date: 'Mon', sales: 4000, qty: 240 },
  { date: 'Tue', sales: 3000, qty: 139 },
  { date: 'Wed', sales: 2000, qty: 980 },
  { date: 'Thu', sales: 2780, qty: 390 },
  { date: 'Fri', sales: 1890, qty: 480 },
  { date: 'Sat', sales: 2390, qty: 380 },
  { date: 'Sun', sales: 3490, qty: 430 },
];

const downloadReport = (content: string, filename: string) => {
  const element = document.createElement("a");
  const file = new Blob([content], {type: 'text/html'});
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const printReport = (content: string) => {
  const printWindow = window.open('', '', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Pharma Trace Report</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #1e293b; }
            h1 { font-size: 1.5rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
            h2 { font-size: 1.25rem; color: #0f172a; margin-top: 24px; margin-bottom: 12px; }
            p { margin-bottom: 12px; line-height: 1.6; color: #334155; }
            ul { margin-bottom: 16px; padding-left: 24px; }
            li { margin-bottom: 8px; line-height: 1.5; color: #334155; }
            strong { color: #0f172a; }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};

const Analytics = () => {
  const { profile } = useAuth();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [recipientId, setRecipientId] = useState('');

  const handleShare = () => {
    if (!recipientId.trim() || !profile) return;
    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #333;">Pharmacy Snapshot Report</h2>
        <table style="width: 100%; text-align: left; border-collapse: collapse;">
          <tr style="background-color: #f8fafc;"><th style="padding: 10px;">Total Revenue</th><td style="padding: 10px; font-weight: bold;">₹45,231.89</td></tr>
          <tr><th style="padding: 10px;">Transactions</th><td style="padding: 10px; font-weight: bold;">1,284</td></tr>
          <tr style="background-color: #f8fafc;"><th style="padding: 10px;">Low Stock Alerts</th><td style="padding: 10px; font-weight: bold;">12 Items</td></tr>
          <tr><th style="padding: 10px;">Pending Returns</th><td style="padding: 10px; font-weight: bold;">5 Batches</td></tr>
        </table>
        <p style="margin-top: 20px; color: #64748b; font-size: 12px;">Generated automatically via Pharmax Unified Platform</p>
      </div>
    `;
    shareReport(recipientId, 'Pharmacy Analytics Snapshot', html, profile);
    toast.success('Report shared to ' + recipientId);
    setIsShareModalOpen(false);
    setRecipientId('');
  };

  const { products, batches, bills, reverseChain } = usePOS();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<string | null>(null);

  const calculateTotalSales = () => bills.reduce((acc, bill) => acc + bill.total, 0);
  const calculateTotalStock = () => batches.reduce((acc, batch) => acc + batch.quantity, 0);
  const calculateExpiringSoon = () => batches.filter(b => b.status === 'NEAR_EXPIRY' || b.status === 'CRITICAL').length;

  const { totalStock, expiredCount, expiredBatches, totalBatches } = useMemo(() => {
    let stock = 0;
    let expired = 0;
    const expiredList = [];
    
    for (const batch of mockBatches) {
      stock += batch.quantity;
      const isExpired = new Date(batch.expDate) < new Date() || batch.status === 'Expired';
      if (isExpired) {
        expired += 1;
        expiredList.push(batch);
      }
    }
    
    return { 
      totalStock: stock, 
      expiredCount: expired, 
      expiredBatches: expiredList,
      totalBatches: mockBatches.length
    };
  }, [mockBatches]);


  const generateAIReport = () => {
    setIsGenerating(true);
    setReportData(null);
    
    setTimeout(() => {
      try {
        const totalSalesVal = calculateTotalSales();
        const stockUnits = calculateTotalStock();
        const expiringSoonCount = calculateExpiringSoon();
        const realExpiredBatches = batches.filter(b => b.status === 'EXPIRED');
        const activeBatches = batches.filter(b => b.status === 'ACTIVE');
        
        // Find top selling medicine (simplified)
        const medSales: Record<string, number> = {};
        bills.forEach(bill => {
          bill.items.forEach(item => {
            medSales[item.productName] = (medSales[item.productName] || 0) + item.quantity;
          });
        });
        const topMed = Object.entries(medSales).sort((a, b) => b[1] - a[1])[0];
        const topMedText = topMed ? `${topMed[0]} (${topMed[1]} units)` : 'No sales data available';

        const hasSufficientData = bills.length > 0 || batches.length > 0;

        let generatedHtml = '';

        if (!hasSufficientData) {
          generatedHtml = `
            <h1>Pharma Trace Pharmacy Intelligence Report</h1>
            <h2>Data Insufficient</h2>
            <p>There is currently insufficient data to generate a complete report. The system requires active inventory batches or recorded sales to perform analysis.</p>
            <h3>How to improve this report:</h3>
            <ul>
              <li>Add medicine batches to your inventory.</li>
              <li>Process sales transactions using the Billing POS.</li>
              <li>Allow time for stock movement data to accumulate.</li>
            </ul>
          `;
        } else {
          generatedHtml = `
            <h1>Pharma Trace Pharmacy Intelligence Report</h1>
            
            <h2>1. Executive Summary</h2>
            <p>Overall pharmacy status indicates ${stockUnits > 0 ? 'active' : 'dormant'} operations with a current inventory of <strong>${stockUnits}</strong> units across <strong>${batches.length}</strong> tracked batches. Total recorded revenue stands at <strong>₹${totalSalesVal.toLocaleString()}</strong>.</p>
            
            <h2>2. Sales Analysis</h2>
            <ul>
              <li><strong>Total Bills Generated:</strong> ${bills.length}</li>
              <li><strong>Total Revenue:</strong> ₹${totalSalesVal.toLocaleString()}</li>
              <li><strong>Top-selling Medicine:</strong> ${topMedText}</li>
              <li><strong>Sales Trends:</strong> ${bills.length > 0 ? 'Consistent sales velocity based on recorded transactions.' : 'No active sales trends recorded.'}</li>
            </ul>

            <h2>3. Inventory Analysis</h2>
            <ul>
              <li><strong>Total Stock Units:</strong> ${stockUnits}</li>
              <li><strong>Active Batches:</strong> ${activeBatches.length}</li>
              <li><strong>Low-stock Risk:</strong> ${stockUnits < 50 ? 'High (Replenishment recommended)' : 'Normal'}</li>
              <li><strong>Stock Movement:</strong> ${bills.length > 10 ? 'High velocity' : 'Standard velocity'}</li>
            </ul>

            <h2>4. Expiry Risk Analysis</h2>
            <ul>
              <li><strong>Expired Batches:</strong> ${realExpiredBatches.length}</li>
              <li><strong>Near-expiry & Critical Batches:</strong> ${expiringSoonCount}</li>
              <li><strong>High-risk Inventory:</strong> ${expiringSoonCount > 0 ? 'Attention required for upcoming expirations.' : 'No immediate expiration risks.'}</li>
              <li><strong>Recommended Actions:</strong> ${expiringSoonCount > 0 ? 'Implement First-Expiry-First-Out (FEFO) dispensing strictly.' : 'Continue standard operations.'}</li>
            </ul>

            <h2>5. Reverse Logistics</h2>
            <ul>
              <li><strong>Pending Return Requests:</strong> ${(reverseChain || []).filter(r => r.status === 'RETURN_REQUESTED').length}</li>
              <li><strong>Expired Medicines Awaiting Collection:</strong> ${realExpiredBatches.length}</li>
              <li><strong>Reverse-chain Status:</strong> ${(reverseChain && reverseChain.length > 0) ? 'Active reverse logistics operations recorded.' : 'No reverse logistics data available.'}</li>
            </ul>

            <h2>6. Recommendations</h2>
            <p>Based on current system data, we recommend the following actionable steps:</p>
            <ul>
              ${expiringSoonCount > 0 ? '<li><strong>Urgent:</strong> Isolate and heavily discount near-expiry batches to prevent loss.</li>' : ''}
              ${realExpiredBatches.length > 0 ? '<li><strong>Compliance:</strong> Initiate automated reverse-chain procedures for the ' + realExpiredBatches.length + ' expired batches immediately.</li>' : ''}
              ${stockUnits < 50 ? '<li><strong>Restock:</strong> Contact distributors for inventory replenishment to prevent stockouts.</li>' : ''}
              <li><strong>Sales Strategy:</strong> Monitor top-selling items like ${topMedText.split(' ')[0]} to maintain optimal buffer stock.</li>
            </ul>
          `;
        }

        setReportData(generatedHtml);
        toast.success("Professional Report Generated successfully!");
      } catch (error) {
        toast.error("Unable to generate report. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    }, 1500);
  };

  const handleDownload = () => {
    if (!reportData) return;
    downloadReport(reportData, `PharmaTrace_Report_${new Date().toISOString().split('T')[0]}.html`);
  };



  const handlePrint = () => {
    if (!reportData) return;
    printReport(reportData);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <SharedReportInbox />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reports</h2>
          <p className="text-slate-500 text-sm">Generate comprehensive reports for sales, stock, and expiring medicines.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-xl bg-blue-50 text-blue-600">
            <IndianRupee size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-900">₹{calculateTotalSales().toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Stock Items</p>
            <p className="text-2xl font-bold text-slate-900">{calculateTotalStock()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-xl bg-orange-50 text-orange-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Expiring Soon</p>
            <p className="text-2xl font-bold text-slate-900">{calculateExpiringSoon()} batches</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Expired Batches (Mock)</p>
            <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue & Sales Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockSalesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} name="Revenue (₹)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Units Sold by Day</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockSalesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="qty" fill="#6366f1" radius={[4, 4, 0, 0]} name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/3 bg-slate-50 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col gap-6">
          <div>
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" /> Generate AI Report
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Analyze billing history, inventory, stock movement, and expiry risks to generate a professional pharmacy report.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={generateAIReport}
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {isGenerating ? (
                <><Loader2 size={18} className="animate-spin" /> Generating Report...</>
              ) : (
                <><Sparkles size={18} /> Generate AI Report</>
              )}
            </button>
          </div>
        </div>

        <div className="w-full lg:w-2/3 p-6 flex flex-col bg-white min-h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Generated Report</h3>
            {reportData && (
              <div className="flex items-center gap-3">

                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
                  Share via ID
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors border border-slate-200"
                >
                  <Printer size={16} /> Print Report
                </button>
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors border border-emerald-200"
                >
                  <Download size={16} /> Download Report
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-6 overflow-y-auto max-h-[600px]">
            <style>{`
              .report-content h2 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-top: 1.5rem; margin-bottom: 0.75rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
              .report-content h3 { font-size: 1.25rem; font-weight: 600; color: #1e293b; margin-top: 1.25rem; margin-bottom: 0.5rem; }
              .report-content p { color: #334155; margin-bottom: 1rem; line-height: 1.6; }
              .report-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; color: #334155; }
              .report-content li { margin-bottom: 0.25rem; }
              .report-content strong { color: #0f172a; font-weight: 600; }
            `}</style>
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 py-20">
                <Loader2 size={40} className="animate-spin text-indigo-400" />
                <p>Loading / Analyzing...</p>
              </div>
            ) : reportData ? (
              <div className="report-content" dangerouslySetInnerHTML={{ __html: reportData }} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 py-20 text-center px-8">
                <FileText size={48} className="text-slate-200" />
                <p>No report generated yet.<br/>Click Generate AI Report to analyze your pharmacy data.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Expired Medicines Attention Required (Mock Data)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Batch ID</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Medicine</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiry Date</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity Left</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expiredBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50">
                  <td className="p-4 text-sm font-medium text-slate-900">{batch.id}</td>
                  <td className="p-4 text-sm text-slate-600">{batch.name}</td>
                  <td className="p-4 text-sm font-medium text-red-600">{batch.expDate}</td>
                  <td className="p-4 text-sm text-slate-600">{batch.quantity}</td>
                  <td className="p-4">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                      {batch.status}
                    </span>
                  </td>
                </tr>
              ))}
              {expiredBatches.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No expired batches found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    
      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Share Report via ID</h3>
            <p className="text-sm text-slate-500 mb-6">Enter the exact User ID of the Distributor or Manufacturer to send this report directly to their inbox.</p>
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Recipient ID (e.g. demo-manufacturer)</label>
              <input type="text" value={recipientId} onChange={(e) => setRecipientId(e.target.value)} placeholder="Enter ID..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setIsShareModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleShare} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"><Send size={16} /> Send Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;