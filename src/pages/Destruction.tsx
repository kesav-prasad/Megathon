import React, { useState, useEffect } from 'react';
import { Trash2, Upload, FileText, CheckCircle2, AlertCircle, RefreshCcw, FileDigit, Calendar, Hash } from 'lucide-react';
import { getLocalReturns, updateLocalReturn, createLocalReturnEvent } from '../data/mockReturnsDb';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Destruction = () => {
  const { profile } = useAuth();
  const [awaitingDestruction, setAwaitingDestruction] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [certGenerated, setCertGenerated] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    fetchAwaiting();
    window.addEventListener('storage', fetchAwaiting);
    return () => window.removeEventListener('storage', fetchAwaiting);
  }, []);

  const fetchAwaiting = () => {
    const allReturns = getLocalReturns();
    const awaiting = allReturns.filter(r => r.status === 'AWAITING_DESTRUCTION' || r.status === 'DESTROYED');
    setAwaitingDestruction(awaiting);
  };

  const executeDestruction = () => {
    if (!verified) {
      toast.error('You must verify the physical batch quantity first.');
      return;
    }
    
    // Update local database
    updateLocalReturn(selectedBatch.id, { status: 'DESTROYED' });
    createLocalReturnEvent({
      return_id: selectedBatch.id,
      event_type: 'DESTROYED',
      performed_by: profile?.user_id || 'disposal_facility',
      performed_by_name: profile?.full_name || 'EnviroSafe',
      performed_role: 'disposal',
      notes: 'Batch fully incinerated per CPCB guidelines'
    });
    
    setCertGenerated(true);
    fetchAwaiting();
    toast.success('Destruction completed and sealed globally.');
    
    // Dispatch event to trigger notification panels on other tabs
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Destruction Facility</h2>
          <p className="text-slate-500 text-sm">Verify and process medicine destruction safely.</p>
        </div>
        <button onClick={fetchAwaiting} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
          <RefreshCcw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Queue & Workflow */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-4 mb-4">Batches Awaiting Destruction</h3>
            
            {awaitingDestruction.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-slate-300" />
                <p>No batches currently pending destruction.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {awaitingDestruction.map((batch) => (
                  <div 
                    key={batch.id}
                    onClick={() => {
                      setSelectedBatch(batch);
                      setCertGenerated(batch.status === 'DESTROYED');
                      setVerified(false);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedBatch?.id === batch.id ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <Hash size={14} className="text-slate-400"/> {batch.batch_number}
                      </span>
                      {batch.status === 'DESTROYED' ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold uppercase tracking-wider">Destroyed</span>
                      ) : (
                        <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-1 rounded font-bold uppercase tracking-wider">Pending</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 truncate">{batch.medicine_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedBatch && selectedBatch.status !== 'DESTROYED' && (
            <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-sm shadow-rose-100/50">
              <h3 className="font-semibold text-rose-900 border-b border-rose-100 pb-4 mb-4 flex items-center gap-2">
                <Trash2 size={18} /> Active Destruction Workflow
              </h3>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Batch Number</span>
                    <h4 className="text-lg font-bold text-slate-900">{selectedBatch.batch_number}</h4>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full text-center">Ticket<br/>{selectedBatch.ticket_number}</span>
                </div>
                <p className="text-sm text-slate-700"><strong>Medicine:</strong> {selectedBatch.medicine_name}</p>
                <p className="text-sm text-slate-700"><strong>Quantity:</strong> {selectedBatch.quantity_expected} Units</p>
                <p className="text-sm text-slate-700 mb-2"><strong>Reason:</strong> {selectedBatch.return_reason}</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-rose-50 p-3 rounded-lg border border-rose-100">
                  <input 
                    type="checkbox" 
                    id="verify" 
                    checked={verified}
                    onChange={(e) => setVerified(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer" 
                  />
                  <label htmlFor="verify" className="text-sm font-medium text-rose-900 cursor-pointer">
                    I confirm that the physical quantity received matches the system record and is ready for incineration.
                  </label>
                </div>
                
                <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-rose-400 transition-colors text-center cursor-pointer">
                  <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                  <p className="text-sm font-medium text-slate-700">Upload Video/Photo Evidence</p>
                  <p className="text-xs text-slate-500 mt-1">MP4 or JPG up to 50MB (Optional for Demo)</p>
                </div>

                {!certGenerated ? (
                  <button 
                    onClick={executeDestruction}
                    className="w-full bg-slate-900 hover:bg-black text-white py-3.5 rounded-xl font-bold transition-all flex justify-center items-center gap-2 active:scale-95 shadow-md"
                  >
                    <Flame size={18} className="text-rose-400" /> Execute Destruction
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Certificate Display */}
        <div>
          {!selectedBatch ? (
            <div className="h-full min-h-[400px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <FileDigit size={48} className="mb-4 text-slate-300" />
              <p className="font-medium text-slate-500">Select a batch to view details</p>
            </div>
          ) : certGenerated ? (
            <div className="bg-white border-2 border-emerald-500 rounded-2xl shadow-xl shadow-emerald-100 overflow-hidden relative sticky top-6">
              <div className="bg-slate-900 p-6 text-center">
                <FileText size={48} className="text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white tracking-widest uppercase">Destruction Certificate</h3>
                <p className="text-slate-400 text-sm mt-1">Legally Binding Digital Record</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Certificate ID</p>
                    <p className="font-mono text-lg font-bold text-slate-900">DC-{new Date().getFullYear()}-{selectedBatch.id.substring(4, 8).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 flex justify-end items-center gap-1"><Calendar size={12}/> Date</p>
                    <p className="text-slate-900 font-medium">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Batch Number</p>
                    <p className="text-slate-900 font-medium font-mono">{selectedBatch.batch_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Medicine</p>
                    <p className="text-slate-900 font-medium">{selectedBatch.medicine_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Quantity</p>
                    <p className="text-slate-900 font-medium">{selectedBatch.quantity_expected} Units</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Status</p>
                    <p className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 size={16}/> DESTROYED</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-500 mb-2 font-bold tracking-wider uppercase">Authorized Hash Signature</p>
                  <p className="font-mono text-[10px] text-slate-400 break-all">
                    0x{Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')}_VERIFIED
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition-colors">
                    Download PDF
                  </button>
                  <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold transition-colors">
                    Share Record
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <AlertCircle size={48} className="mb-4 text-slate-300" />
              <p className="font-medium text-slate-500">Certificate will appear here</p>
              <p className="text-sm mt-2">Complete the destruction workflow to generate a verifiable certificate.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Destruction;
