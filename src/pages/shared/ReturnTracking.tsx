import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ReturnTimeline, ReturnEvent } from '../../components/ReturnTimeline';
import { Activity, Package, Search, ArrowLeft, ShieldAlert, CheckCircle, Clock, Truck, ShieldCheck, Download, Trash2, Plus, XCircle, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getLocalReturns, getLocalReturnEvents, updateLocalReturn, createLocalReturnEvent } from '../../data/mockReturnsDb';

export const ReturnTracking = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [returns, setReturns] = useState<any[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [events, setEvents] = useState<ReturnEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Action states
  const [actionQuantity, setActionQuantity] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReturns();
    
    // Add real-time sync across tabs
    window.addEventListener('storage', fetchReturns);
    
    // Fallback polling for robust demo
    const interval = setInterval(() => {
      fetchReturns();
    }, 3000);
    
    return () => {
      window.removeEventListener('storage', fetchReturns);
      clearInterval(interval);
    };
  }, [profile]);

  // Keep selectedReturn synced with background updates
  useEffect(() => {
    if (selectedReturn) {
      const updated = returns.find(r => r.id === selectedReturn.id);
      if (updated && updated.status !== selectedReturn.status) {
        loadReturnDetails(updated);
      }
    }
  }, [returns]);

  

  const fetchReturns = async () => {
    if (!profile) return;
    // Only set loading true if we have no returns (first load), to prevent UI flashing during polling
    if (returns.length === 0) setLoading(true);

    try {


      const isDemo = profile.user_id.startsWith('demo-');

      let query = supabase.from('returns').select('*').order('created_at', { ascending: false });
      
      if (!isDemo) {
        if (profile.role === 'pharmacy') {
          query = query.eq('pharmacy_id', profile.user_id);
        } else if (profile.role === 'distributor') {
          query = query.eq('distributor_id', profile.user_id);
        } else if (profile.role === 'manufacturer') {
          query = query.eq('manufacturer_id', profile.user_id);
        }
      }
      
      let supData = [];
      const { data, error } = await query;
      if (error) {
         const { data: fallbackData } = await supabase.from('returns').select('*').order('created_at', { ascending: false });
         supData = fallbackData || [];
      } else {
         supData = data || [];
      }
      
      let locData = getLocalReturns();
      
      let needsHeal = false;
      locData = locData.map(r => {
        if (!r.distributor_id || r.distributor_id === 'null' || r.distributor_id === null) {
          needsHeal = true;
          return { ...r, distributor_id: 'demo-distributor' };
        }
        return r;
      });
      if (needsHeal) {
         localStorage.setItem('PHARMAX_LOCAL_RETURNS', JSON.stringify(locData));
      }

      if (!isDemo) {
        if (profile.role === 'pharmacy') {
          locData = locData.filter(r => r.pharmacy_id === profile.user_id);
        } else if (profile.role === 'distributor') {
          locData = locData.filter(r => r.distributor_id === profile.user_id);
        } else if (profile.role === 'manufacturer') {
          locData = locData.filter(r => r.manufacturer_id === profile.user_id);
        }
      }
      // If isDemo is true, we do absolutely NO filtering! We show every single return in the local mock db so it is GUARANTEED to sync across the 3 roles on this browser.


      
      const allReturns = [...supData, ...locData].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setReturns(allReturns);
      
    } catch (err: any) {
      toast.error('Failed to fetch returns: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  
  const loadReturnDetails = async (ret: any) => {
    setSelectedReturn(ret);
    setActionQuantity(ret.quantity_expected?.toString() || '');
    setActionNotes('');
    
    try {
      if (ret.id.startsWith('ret-')) {
        // Local return
        const localEvents = getLocalReturnEvents().filter(e => e.return_id === ret.id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setEvents(localEvents);
        return;
      }
      
      const { data, error } = await supabase
        .from('return_events')
        .select(`
          event_type, performed_role, quantity, notes, created_at,
          profiles:performed_by (full_name)
        `)
        .eq('return_id', ret.id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      const formattedEvents = data.map((d: any) => ({
        event_type: d.event_type,
        performed_by_name: d.profiles?.full_name || 'Unknown User',
        performed_role: d.performed_role,
        quantity: d.quantity,
        notes: d.notes,
        created_at: d.created_at
      }));
      
      setEvents(formattedEvents);
    } catch (err: any) {
      toast.error('Failed to load timeline.');
    }
  };

  
  const handleAction = async (newStatus: string, eventType: string) => {
    if (!profile || !selectedReturn) return;
    setActionLoading(true);

    try {
      const qty = parseInt(actionQuantity);
      
      let finalStatus = newStatus;
      let isDispute = false;
      if (eventType === 'DISTRIBUTOR_RECEIVED') {
        if (qty !== selectedReturn.quantity_expected) {
          finalStatus = 'DISPUTED';
          isDispute = true;
        } else {
          finalStatus = 'VERIFIED';
        }
      }

      if (selectedReturn.id.startsWith('ret-')) {
        // Local action
        updateLocalReturn(selectedReturn.id, {
          status: finalStatus,
          ...(eventType === 'DISTRIBUTOR_RECEIVED' && { quantity_received_dist: qty }),
          ...(eventType === 'MANUFACTURER_RECEIVED' && { quantity_received_mfr: qty })
        });
        
        createLocalReturnEvent({
          return_id: selectedReturn.id,
          event_type: isDispute ? 'DISPUTED' : eventType,
          performed_by: profile.user_id,
          performed_by_name: profile.full_name,
          performed_role: profile.role,
          quantity: qty || null,
          notes: actionNotes
        });
        
        const refreshed = getLocalReturns().find(r => r.id === selectedReturn.id);
        if (refreshed) {
           await loadReturnDetails(refreshed);
           setReturns(prev => prev.map(r => r.id === refreshed.id ? refreshed : r));
        }
        window.dispatchEvent(new Event('storage'));
      } else {
        // Supabase action
        const { error: updateError } = await supabase
          .from('returns')
          .update({ 
            status: finalStatus,
            ...(eventType === 'DISTRIBUTOR_RECEIVED' && { quantity_received_dist: qty }),
            ...(eventType === 'MANUFACTURER_RECEIVED' && { quantity_received_mfr: qty })
          })
          .eq('id', selectedReturn.id);

        if (updateError) throw updateError;

        const { error: eventError } = await supabase
          .from('return_events')
          .insert({
            return_id: selectedReturn.id,
            event_type: isDispute ? 'DISPUTED' : eventType,
            performed_by: profile.user_id,
            performed_role: profile.role,
            quantity: qty || null,
            notes: actionNotes
          });

        if (eventError) throw eventError;
        
        const { data: refreshedReturn } = await supabase.from('returns').select('*').eq('id', selectedReturn.id).single();
        if (refreshedReturn) {
          await loadReturnDetails(refreshedReturn);
          setReturns(prev => prev.map(r => r.id === refreshedReturn.id ? refreshedReturn : r));
        }
      }
      toast.success('Action recorded successfully.');

    } catch (err: any) {
      toast.error('Failed to process action: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'CLOSED' || status === 'DESTROYED') return 'bg-slate-100 text-slate-800 border-slate-300';
    if (status === 'DISPUTED' || status === 'REJECTED') return 'bg-red-100 text-red-800 border-red-200';
    if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  if (loading) return <div className="p-8 text-slate-500">Loading tracking system...</div>;

  if (selectedReturn) {
    const r = selectedReturn;
    const isPharmacy = profile?.role === 'pharmacy';
    const isDistributor = profile?.role === 'distributor';
    const isManufacturer = profile?.role === 'manufacturer';

    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 print:max-w-full print:p-0">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedReturn(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-slate-600" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">{r.tracking_id}</h1>
              </div>
              <p className="text-slate-500 font-medium tracking-wide text-sm mt-1">RETURN MANIFEST</p>
            </div>
          </div>
          
          <button 
            onClick={() => window.print()}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Printer size={18} /> Print Manifest PDF
          </button>
        </div>
        
        {/* Print Only Header */}
        <div className="hidden print:block text-center border-b-2 border-slate-900 pb-6 mb-8 mt-4">
           <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest">OFFICIAL RETURN MANIFEST</h1>
           <p className="text-slate-800 mt-2 font-mono text-xl font-bold">TRACKING ID: {r.tracking_id}</p>
           <p className="text-slate-500 text-sm mt-2">Generated on: {new Date().toLocaleString()}</p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(r.status)}`}>
            {r.status.replace(/_/g, ' ')}
          </span>
          <p className="text-slate-500 font-medium">Closed-Loop Return Delivery</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
              <Package size={32} className="text-blue-400 mb-4" />
              <h2 className="text-2xl font-bold mb-1">{r.medicine_name}</h2>
              <p className="text-blue-400 font-mono mb-6">Batch: {r.batch_number}</p>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Expected Quantity</p>
                  <p className="text-lg font-medium">{r.quantity_expected} Tablets</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Return Reason</p>
                  <p className="text-lg font-medium">{r.return_reason}</p>
                </div>
              </div>
            </div>

            {r.status !== 'CLOSED' && r.status !== 'REJECTED' && (
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-blue-600" />
                  Action Required
                </h3>

                {(isDistributor || (isManufacturer && (r.status === 'IN_TRANSIT_TO_MANUFACTURER' || r.status === 'AWAITING_DESTRUCTION'))) && r.status !== 'DISPUTED' && r.status !== 'PENDING_MANUFACTURER_APPROVAL' && (
                  <div className="space-y-4 mb-6">
                    {r.status === 'IN_TRANSIT_TO_DISTRIBUTOR' || r.status === 'IN_TRANSIT_TO_MANUFACTURER' ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Confirmed Quantity</label>
                        <input 
                          type="number" 
                          value={actionQuantity}
                          onChange={e => setActionQuantity(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 font-mono text-lg"
                        />
                      </div>
                    ) : null}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notes / Evidence (Optional)</label>
                      <textarea 
                        value={actionNotes}
                        onChange={e => setActionNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm h-20"
                        placeholder="Condition of package, etc."
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Manufacturer Approvals */}
                  {isManufacturer && r.status === 'PENDING_MANUFACTURER_APPROVAL' && (
                    <>
                      <button onClick={() => handleAction('APPROVED', 'MANUFACTURER_APPROVED')} disabled={actionLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                        <CheckCircle size={20} /> APPROVE RETURN
                      </button>
                      <button onClick={() => handleAction('REJECTED', 'MANUFACTURER_REJECTED')} disabled={actionLoading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                        <XCircle size={20} /> REJECT RETURN
                      </button>
                    </>
                  )}

                  {/* Distributor Actions */}
                  {isDistributor && r.status === 'APPROVED' && (
                    <button onClick={() => handleAction('PICKUP_ASSIGNED', 'PICKUP_ASSIGNED')} disabled={actionLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                      <Truck size={20} /> ASSIGN PICKUP
                    </button>
                  )}
                  {isDistributor && r.status === 'PICKUP_ASSIGNED' && (
                    <button onClick={() => handleAction('PICKED_UP', 'PICKED_UP')} disabled={actionLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                      <Package size={20} /> CONFIRM PICKUP
                    </button>
                  )}
                  {isDistributor && r.status === 'PICKED_UP' && (
                    <button onClick={() => handleAction('IN_TRANSIT_TO_DISTRIBUTOR', 'IN_TRANSIT_TO_DISTRIBUTOR')} disabled={actionLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                      <Truck size={20} /> MARK IN TRANSIT (HUB)
                    </button>
                  )}
                  {isDistributor && r.status === 'IN_TRANSIT_TO_DISTRIBUTOR' && (
                    <button onClick={() => handleAction('VERIFIED', 'DISTRIBUTOR_RECEIVED')} disabled={actionLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                      <CheckCircle size={20} /> HUB RECEIVE & VERIFY
                    </button>
                  )}
                  {isDistributor && r.status === 'DISPUTED' && (
                    <button onClick={() => handleAction('VERIFIED', 'DISPUTE_RESOLVED')} disabled={actionLoading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                      <CheckCircle size={20} /> RESOLVE DISPUTE
                    </button>
                  )}
                  {isDistributor && r.status === 'VERIFIED' && (
                    <button onClick={() => handleAction('IN_TRANSIT_TO_MANUFACTURER', 'DISPATCHED_TO_MANUFACTURER')} disabled={actionLoading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                      <Truck size={20} /> DISPATCH TO MANUFACTURER
                    </button>
                  )}

                  {/* Manufacturer End-of-Life */}
                  {isManufacturer && r.status === 'IN_TRANSIT_TO_MANUFACTURER' && (
                    <button onClick={() => handleAction('MANUFACTURER_RECEIVED', 'MANUFACTURER_RECEIVED')} disabled={actionLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                      <CheckCircle size={20} /> CONFIRM MFR RECEIPT
                    </button>
                  )}
                  {isManufacturer && r.status === 'MANUFACTURER_RECEIVED' && (
                    <button onClick={() => handleAction('AWAITING_DESTRUCTION', 'SENT_FOR_DESTRUCTION')} disabled={actionLoading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                      <ShieldAlert size={20} /> MARK AWAITING DESTRUCTION
                    </button>
                  )}
                  {isManufacturer && r.status === 'AWAITING_DESTRUCTION' && (
                    <button onClick={() => handleAction('DESTROYED', 'DESTROYED')} disabled={actionLoading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                      <Trash2 size={20} /> COMPLETE DESTRUCTION
                    </button>
                  )}
                  {isManufacturer && r.status === 'DESTROYED' && (
                    <button onClick={() => handleAction('CLOSED', 'CLOSED')} disabled={actionLoading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                      <CheckCircle size={20} /> CLOSE RETURN RECORD
                    </button>
                  )}

                  {isPharmacy && (
                    <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <Clock className="mx-auto text-slate-400 mb-2" size={24} />
                      <p className="text-sm font-medium text-slate-500">Awaiting processing by supply chain partners.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-4">Lifecycle Timeline</h2>
              <ReturnTimeline status={r.status} events={events} />
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">Return Deliveries</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Sync
            </div>
          </div>
          <p className="text-slate-500 mb-4">Closed-loop tracking for expired medicine reverse logistics.</p>

          {profile?.role === 'pharmacy' && (
            <button onClick={() => navigate('/pharmacy/create-return')} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all">
              <Plus size={18} /> Request Return
            </button>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input type="text" placeholder="Search Tracking ID..." className="outline-none bg-transparent text-sm w-48" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {returns.map(ret => (
          <div key={ret.id} onClick={() => loadReturnDetails(ret)} className="bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full opacity-20 transition-transform group-hover:scale-150 ${getStatusColor(ret.status)}`} />
            
            <div className="flex justify-between items-start mb-4">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(ret.status)}`}>
                {ret.status.replace(/_/g, ' ')}
              </span>
            </div>
            

            <h3 className="font-mono font-bold text-lg text-slate-900 mb-1 tracking-tight">{ret.tracking_id}</h3>
            <p className="font-bold text-slate-800 text-lg mb-1">{ret.medicine_name}</p>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-mono border border-slate-200">ID: {ret.tablet_id}</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-mono border border-blue-100">Batch: {ret.batch_number}</span>
            </div>

            
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Expected Qty</p>
                <p className="font-medium text-slate-700">{ret.quantity_expected} units</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Created</p>
                <p className="font-medium text-slate-700">{new Date(ret.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}

        {returns.length === 0 && (
          <div className="col-span-full bg-slate-50 border border-slate-200 rounded-3xl p-16 text-center">
            <Package size={48} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Returns Found</h3>
            <p className="text-slate-500">There are no return records in your pipeline.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default ReturnTracking;
