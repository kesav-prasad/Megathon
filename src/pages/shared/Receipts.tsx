import React, { useEffect, useState } from 'react';
import { useAuth, DEMO_PROFILES } from '../../context/AuthContext';
import { getLocalReturns } from '../../data/mockReturnsDb';
import { getBatches } from '../../data/db';
import { Printer, FileText, Download, Share2 } from 'lucide-react';

const Receipts = () => {
  const { profile } = useAuth();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  useEffect(() => {
    const returns = getLocalReturns();
    const batches = getBatches();
    
    let filtered = returns;
    if (profile && !profile.user_id.startsWith('demo-')) {
       if (profile.role === 'pharmacy') filtered = returns.filter(r => r.pharmacy_id === profile.user_id);
       else if (profile.role === 'distributor') filtered = returns.filter(r => r.distributor_id === profile.user_id);
       else if (profile.role === 'manufacturer') filtered = returns.filter(r => r.manufacturer_id === profile.user_id);
    }

    const enriched = filtered.map(ret => {
      const batch = batches.find(b => b.productId === ret.tablet_id);
      const price = batch ? batch.mrp : 150;
      const total = ret.quantity_expected * price;
      return { ...ret, unit_price: price, grand_total: total };
    });
    
    enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setReceipts(enriched);
  }, [profile]);

  const handlePrint = () => window.print();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-section, .print-section * { visibility: visible; }
          .print-section { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex justify-between items-end no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shared Receipts</h1>
          <p className="text-slate-500">Official printable transaction records exchanged between partners.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4 no-print h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {receipts.map(r => (
            <div key={r.id} onClick={() => setSelectedReceipt(r)} className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${selectedReceipt?.id === r.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Receipt</span>
                <span className="text-xs font-mono text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="font-bold text-slate-900">{r.medicine_name}</h3>
              <p className="text-sm font-mono text-slate-500 mb-2">ID: {r.tracking_id}</p>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-600">{r.quantity_expected} units</span>
                <span className="text-emerald-600">₹{r.grand_total.toLocaleString()}</span>
              </div>
            </div>
          ))}
          {receipts.length === 0 && (
            <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl">
              <FileText className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-slate-500 font-medium">No receipts available.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedReceipt ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm print-section">
              <div className="border-b-2 border-slate-900 pb-6 mb-6 flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Official Receipt</h2>
                  <p className="text-slate-500 font-medium mt-1">Transaction Record & Manifest</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Receipt No.</p>
                  <p className="text-xl font-mono font-bold text-slate-900">{selectedReceipt.tracking_id}</p>
                  <p className="text-sm text-slate-500 mt-1">{new Date(selectedReceipt.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">From (Pharmacy)</p>
                  <p className="font-bold text-slate-900">{DEMO_PROFILES['demo-pharmacy']?.full_name || 'CityRx Pharmacy'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">To (Manufacturer)</p>
                  <p className="font-bold text-slate-900">{DEMO_PROFILES['demo-manufacturer']?.full_name || 'PharmaCorp Inc'}</p>
                </div>
                <div className="col-span-2 pt-4 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Logistics Partner (Distributor)</p>
                  <p className="font-bold text-slate-900">{DEMO_PROFILES['demo-distributor']?.full_name || 'Global Logistics'}</p>
                </div>
              </div>

              <div className="mb-8">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="pb-3 text-sm font-bold text-slate-900">Description</th>
                      <th className="pb-3 text-sm font-bold text-slate-900">Details</th>
                      <th className="pb-3 text-sm font-bold text-slate-900 text-right">Qty</th>
                      <th className="pb-3 text-sm font-bold text-slate-900 text-right">Unit Price</th>
                      <th className="pb-3 text-sm font-bold text-slate-900 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-4">
                        <p className="font-bold text-slate-900">{selectedReceipt.medicine_name}</p>
                        <p className="text-sm text-slate-500">{selectedReceipt.return_reason}</p>
                      </td>
                      <td className="py-4">
                        <p className="text-sm font-mono text-slate-700">ID: {selectedReceipt.tablet_id}</p>
                        <p className="text-sm font-mono text-slate-700">Batch: {selectedReceipt.batch_number}</p>
                      </td>
                      <td className="py-4 text-right font-medium text-slate-900">{selectedReceipt.quantity_expected}</td>
                      <td className="py-4 text-right font-medium text-slate-900">₹{selectedReceipt.unit_price.toFixed(2)}</td>
                      <td className="py-4 text-right font-bold text-slate-900">₹{selectedReceipt.grand_total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mb-8">
                <div className="w-64 bg-slate-900 text-white p-6 rounded-2xl">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Grand Total</p>
                  <p className="text-3xl font-black">₹{selectedReceipt.grand_total.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
              </div>

              <div className="flex gap-4 justify-end no-print pt-4 border-t border-slate-100">
                <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
                  <Printer size={20} /> Print Receipt / Save PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 no-print">
              <FileText size={48} className="text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">Select a Receipt</h3>
              <p className="text-slate-500">Choose a transaction from the list to view its printable receipt.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Receipts;
