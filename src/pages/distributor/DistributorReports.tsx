import React, { useState } from 'react';
import { FileText, Download, Filter, Search, Send, X } from 'lucide-react';
import { getBatches, getProducts } from '../../data/db';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import SharedReportInbox, { shareReport } from '../../components/SharedReportInbox';
import { useAuth } from '../../context/AuthContext';
import autoTable from 'jspdf-autotable';

const DistributorReports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [pharmacistId, setPharmacistId] = useState('');
  const { profile } = useAuth();
  
  // Combine batches with their corresponding products
  const products = getProducts();
  const allBatches = getBatches();
  
  // Mock data for pharmacy supplies based on active batches
  const suppliedMedicines = allBatches.map(batch => {
    const product = products.find(p => p.id === batch.productId);
    
    // Generating some mock supply data to pharmacy locations
    const pharmacies = ['Apollo Pharmacy, Coimbatore', 'MedPlus, Chennai', 'City Meds, Madurai', 'Wellness Care, Salem'];
    const randomPharmacy = pharmacies[Math.floor(Math.random() * pharmacies.length)];
    
    // Generating random past dates for when it was supplied
    const supplyDate = new Date();
    supplyDate.setDate(supplyDate.getDate() - Math.floor(Math.random() * 30));
    
    return {
      id: `SUP-${batch.id}`,
      batchNumber: batch.batchNumber,
      medicineName: product ? product.name : 'Unknown Medicine',
      category: product ? product.category : 'N/A',
      quantitySupplied: Math.max(1, Math.floor(batch.quantity / 2)),
      pharmacy: randomPharmacy,
      date: supplyDate.toISOString().split('T')[0],
      status: Math.random() > 0.2 ? 'Delivered' : 'In Transit'
    };
  });

  const filteredReports = suppliedMedicines.filter(item => 
    item.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.pharmacy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    if (filteredReports.length === 0) {
      return;
    }

    const headers = ["Supply ID", "Date", "Medicine Name", "Batch Number", "Destination Pharmacy", "Quantity Supplied", "Status"];
    
    const csvRows = [
      headers.join(','), // Header row
      ...filteredReports.map(report => 
        [
          report.id,
          report.date,
          `"${report.medicineName}"`, 
          report.batchNumber,
          `"${report.pharmacy}"`,
          report.quantitySupplied,
          report.status
        ].join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Supply_Reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSharePDF = () => {
    if (!pharmacistId || filteredReports.length === 0 || !profile) return;

    // Generate HTML snapshot for seamless sharing
    let htmlContent = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #333;">Pharmacy Supply Dispatch Report</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: left;">
              <th style="padding: 12px; border-bottom: 2px solid #cbd5e1;">Tracking ID</th>
              <th style="padding: 12px; border-bottom: 2px solid #cbd5e1;">Medicine Name</th>
              <th style="padding: 12px; border-bottom: 2px solid #cbd5e1;">Batch No.</th>
              <th style="padding: 12px; border-bottom: 2px solid #cbd5e1;">Destination</th>
              <th style="padding: 12px; border-bottom: 2px solid #cbd5e1;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${filteredReports.map(r => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${r.id}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${r.medicineName}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${r.batchNumber}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${r.pharmacy}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${new Date(r.date).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    shareReport(pharmacistId, 'Dispatch Report', htmlContent, profile);

    toast.success('Report seamlessly shared to ' + pharmacistId);
    setIsShareModalOpen(false);
    setPharmacistId('');

    // Original PDF logic...
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Pharmacy Supply Dispatch Report', 14, 22);
    doc.setFontSize(11);
    
    // Save/Download PDF locally
    doc.save(`Dispatch_Report_Pharm_${pharmacistId}.pdf`);



    const reportsKey = `shared_reports_${cleanId}`;
    const existingReports = JSON.parse(localStorage.getItem(reportsKey) || '[]');
    existingReports.unshift({
      date: new Date().toLocaleDateString(),
      from: 'Distributor',
      total: 'N/A',
      items: filteredReports.length
    });
    localStorage.setItem(reportsKey, JSON.stringify(existingReports));

    import('react-hot-toast').then(module => {
      module.default.success(`Report securely shared to ID: ${pharmacistId.trim().toUpperCase()}`);
    });

    setTimeout(() => {
      setIsShareModalOpen(false);
      setPharmacistId('');
    }, 500);
  };

  return (
    <div className="space-y-6 relative">
      <SharedReportInbox />
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Supply Reports</h2>
          <p className="text-slate-500">Track and report all medicines dispatched to pharmacies.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download size={16} /> Export CSV
          </button>
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <Send size={16} /> Share as PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by medicine, pharmacy, or batch..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
            <Filter size={16} />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Supply ID</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Medicine & Batch</th>
                <th className="p-4 font-semibold">Destination Pharmacy</th>
                <th className="p-4 font-semibold">Qty</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm font-medium text-slate-900">{report.id}</td>
                  <td className="p-4 text-sm text-slate-600">{report.date}</td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-slate-900">{report.medicineName}</p>
                    <p className="text-xs text-slate-500">Batch: {report.batchNumber}</p>
                  </td>
                  <td className="p-4 text-sm text-slate-700">{report.pharmacy}</td>
                  <td className="p-4 text-sm font-medium text-slate-900">{report.quantitySupplied}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      report.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                    <p>No supply records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Share Report to Pharmacist</h3>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Enter the Pharmacist's Unique ID. The current dataset will be generated as a PDF, downloaded, and securely sent to their system dashboard.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pharmacist Unique ID</label>
                <input 
                  type="text" 
                  placeholder="e.g., PHARM-8892"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={pharmacistId}
                  onChange={(e) => setPharmacistId(e.target.value)}
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSharePDF}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-2 shadow-sm"
              >
                <Send size={16} /> Generate & Send PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributorReports;
