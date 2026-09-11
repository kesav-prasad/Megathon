import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Send, AlertTriangle, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { getBatches, getProducts } from '../../data/db';
import toast from 'react-hot-toast';
import { createLocalReturn, createLocalReturnEvent } from '../../data/mockReturnsDb';

const CreateReturn = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    batchId: '',
    medicineName: '',
    batchNumber: '',
    tabletId: '',
    quantity: '',
    expiryDate: '',
    returnReason: 'Expired',
    notes: ''
  });


  useEffect(() => {
    // Load pharmacy batches and products to get real details
    const allBatches = getBatches();
    const allProducts = getProducts();
    
    // Merge product name into batches for easy display
    const mergedBatches = allBatches.map(b => {
      const p = allProducts.find(prod => prod.id === b.productId);
      return {
        ...b,
        name: p ? p.name : 'Unknown Medicine',
        productId: b.productId
      };
    });
    
    setBatches(mergedBatches);
  }, []);



  const handleBatchSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = batches.find(b => b.id === e.target.value);
    if (selected) {
      setFormData({
        ...formData,
        batchId: selected.id,
        medicineName: selected.name,
        batchNumber: selected.batchNumber,
        tabletId: selected.productId,
        expiryDate: selected.expiryDate || 'N/A',
        quantity: selected.quantity.toString() // Pre-fill with remaining quantity
      });
    }
  };


  const generateTrackingId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `RET-${year}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!formData.batchId) {
      toast.error('Please select a batch from your inventory.');
      return;
    }
    setLoading(true);

    try {
      const trackingId = generateTrackingId();
      
      
      // Check if we are using the mock system
      const isDemo = profile.user_id.startsWith('demo-');
      
      let mfrUserId = 'demo-manufacturer';
      let distUserId = 'demo-distributor';
      
      if (!isDemo) {
        // Fallback to supabase if not in demo mode
        const { data: mfrProfile, error: mfrError } = await supabase.from('profiles').select('user_id').eq('role', 'manufacturer').limit(1).single();
        if (mfrError || !mfrProfile) {
          throw new Error('Could not identify the manufacturer for this batch.');
        }
        mfrUserId = mfrProfile.user_id;
        
        const { data: distProfile } = await supabase.from('profiles').select('user_id').eq('role', 'distributor').limit(1).single();
        if (distProfile) distUserId = distProfile.user_id;
      }

      
      let returnId = '';
      
      // Try Supabase first
      const { data: returnData, error: returnError } = await supabase
        .from('returns')
        .insert({
          tracking_id: trackingId,
          medicine_name: formData.medicineName,
          batch_number: formData.batchNumber,
          tablet_id: formData.tabletId,
          quantity_expected: parseInt(formData.quantity),
          pharmacy_id: profile.user_id,
          return_reason: formData.returnReason,
          status: 'INITIATED' // Important for existing RLS policies
        })
        .select('id')
        .single();

      if (returnError) {
        console.warn("Supabase RLS or insert failed, falling back to local database:", returnError);
        // Fallback to local storage if RLS fails
        const localRet = createLocalReturn({
          tracking_id: trackingId,
          medicine_name: formData.medicineName,
          batch_number: formData.batchNumber,
          tablet_id: formData.tabletId,
          quantity_expected: parseInt(formData.quantity),
          pharmacy_id: profile.user_id,
          distributor_id: distUserId,
          manufacturer_id: mfrUserId,
          return_reason: formData.returnReason,
          status: 'PENDING_MANUFACTURER_APPROVAL'
        });
        returnId = localRet.id;
        
        createLocalReturnEvent({
          return_id: returnId,
          event_type: 'RETURN_REQUESTED',
          performed_by: profile.user_id,
          performed_by_name: profile.full_name,
          performed_role: 'pharmacy',
          quantity: parseInt(formData.quantity),
          notes: `Return requested due to: ${formData.returnReason}. Notes: ${formData.notes}`
        });
      } else {
        returnId = returnData.id;
        
        // Immediately update to PENDING_MANUFACTURER_APPROVAL
        const { error: updateError } = await supabase.from('returns').update({ 
            status: 'PENDING_MANUFACTURER_APPROVAL',
            manufacturer_id: mfrUserId,
            distributor_id: distUserId
        }).eq('id', returnId);
        
        if (updateError) {
          await supabase.from('returns').update({ 
            status: 'PENDING_MANUFACTURER_APPROVAL'
          }).eq('id', returnId);
        }

        // 2. Create Event Record
        await supabase
          .from('return_events')
          .insert({
            return_id: returnId,
            event_type: 'RETURN_REQUESTED',
            performed_by: profile.user_id,
            performed_role: 'pharmacy',
            quantity: parseInt(formData.quantity),
            notes: `Return requested due to: ${formData.returnReason}. Notes: ${formData.notes}`
          });
      }


      // Local Notification for Manufacturer
      const notifsKey = `sys_notifications_mfr`;
      const existingNotifs = JSON.parse(localStorage.getItem(notifsKey) || '[]');
      existingNotifs.unshift({
        type: 'orange',
        text: `New Return Request ${trackingId} from ${profile.full_name}`
      });
      localStorage.setItem(notifsKey, JSON.stringify(existingNotifs));

      toast.success(`Return Request ${trackingId} submitted to manufacturer!`);
      navigate('/pharmacy/returns');

    } catch (error: any) {
      toast.error(error.message || 'Failed to create return request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/pharmacy/returns')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Request Return</h1>
          <p className="text-slate-500">Create a closed-loop return request for expired or unused medicines.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Package className="text-blue-400" size={28} />
            <h2 className="text-xl font-bold">Select Inventory Batch</h2>
          </div>
          <p className="text-slate-400 text-sm">Select a batch from your inventory. The request will be routed directly to the original manufacturer for approval.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Select Batch from Inventory</label>
            <select 
              required
              value={formData.batchId}
              onChange={handleBatchSelect}
              className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl px-4 py-3 outline-none transition-colors"
            >
              <option value="" disabled>-- Select a Batch --</option>

              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name} (Batch: {b.batchNumber}) - {b.quantity} units - Exp: {b.expiryDate}</option>
              ))}

            </select>
          </div>

          {formData.batchId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Medicine Name</label>
                <input readOnly type="text" value={formData.medicineName} className="w-full bg-slate-200 border-transparent rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Batch Number</label>
                <input readOnly type="text" value={formData.batchNumber} className="w-full bg-slate-200 border-transparent rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Quantity to Return</label>
                <input required type="number" max={formData.quantity} value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-xl px-4 py-3 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Expiry Date</label>
                <input readOnly type="date" value={formData.expiryDate} className="w-full bg-slate-200 border-transparent rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Return Reason</label>
                <select required value={formData.returnReason} onChange={e => setFormData({...formData, returnReason: e.target.value})} className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-xl px-4 py-3 outline-none">
                  <option value="Expired">Expired</option>
                  <option value="Near Expiry / Unused">Near Expiry / Unused</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Optional Notes / Evidence Reference</label>
                <input type="text" placeholder="e.g. Package damaged during storage, see photo #123" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-xl px-4 py-3 outline-none" />
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={loading || !formData.batchId} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-colors shadow-lg">
              {loading ? 'Processing...' : <><Send size={20} /> Request Return Approval</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreateReturn;
