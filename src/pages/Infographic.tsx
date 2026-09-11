import React from 'react';
import { 
  Factory, Truck, Store, AlertTriangle, 
  RefreshCcw, Building2, Flame, ShieldAlert,
  FileCheck, Lock, CheckCircle2, ShieldCheck, MapPin, Key, QrCode
} from 'lucide-react';

const Infographic = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans p-8 md:p-12 overflow-x-hidden">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header Section */}
        <div className="bg-slate-900 text-white p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 flex flex-col items-center">
            <ShieldCheck size={64} className="text-emerald-400 mb-6" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              End-to-End Verification of Medicine Disposal
            </h1>
            <p className="text-xl text-slate-300 font-light mb-8 max-w-2xl mx-auto">
              From Production to Destruction — Fully Tracked, Fully Verified.
            </p>
            <div className="bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 px-6 py-3 rounded-full font-semibold flex items-center gap-3 backdrop-blur-sm">
              <CheckCircle2 size={20} />
              No Expired Medicine, No Illegal Re-entry, A Safer India.
            </div>
          </div>
        </div>

        <div className="p-12 space-y-16">
          
          {/* Timeline Section */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center uppercase tracking-wider">
              The Live Tracking Lifecycle
            </h2>
            
            <div className="relative">
              {/* Connecting Line */}
              <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-100 -translate-y-1/2 rounded-full hidden md:block z-0"></div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
                {/* Stage 1 */}
                <div className="bg-white p-4 rounded-xl border-2 border-blue-100 shadow-sm text-center relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase w-max">Forward Supply</div>
                  <Factory className="mx-auto text-blue-500 mb-2 mt-4" size={28} />
                  <p className="text-sm font-semibold text-slate-800">Manufactured & Dispatched</p>
                </div>
                
                {/* Stage 2 */}
                <div className="bg-white p-4 rounded-xl border-2 border-teal-100 shadow-sm text-center relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase w-max">Monitoring</div>
                  <Store className="mx-auto text-teal-500 mb-2 mt-4" size={28} />
                  <p className="text-sm font-semibold text-slate-800">Pharmacy Inventory</p>
                </div>

                {/* Stage 3 */}
                <div className="bg-white p-4 rounded-xl border-2 border-orange-100 shadow-sm text-center relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase w-max">Alerts</div>
                  <AlertTriangle className="mx-auto text-orange-500 mb-2 mt-4" size={28} />
                  <p className="text-sm font-semibold text-slate-800">Near Expiry / Expired</p>
                </div>

                {/* Stage 4 */}
                <div className="bg-white p-4 rounded-xl border-2 border-indigo-100 shadow-sm text-center relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase w-max">Reverse Logistics</div>
                  <RefreshCcw className="mx-auto text-indigo-500 mb-2 mt-4" size={28} />
                  <p className="text-sm font-semibold text-slate-800">Pickup & Transit</p>
                </div>

                {/* Stage 5 */}
                <div className="bg-white p-4 rounded-xl border-2 border-emerald-100 shadow-sm text-center relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase w-max">Permanent Closure</div>
                  <Lock className="mx-auto text-emerald-500 mb-2 mt-4" size={28} />
                  <p className="text-sm font-semibold text-slate-800">Verified Destroyed</p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Verification Cards */}
          <section>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
                How We Verify Correct Disposal?
              </h2>
              <p className="text-slate-500 max-w-3xl mx-auto">
                We ensure that expired medicines are not just returned, but actually destroyed through an authorized and traceable process leveraging Live Tracking algorithms.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* Card 1 */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all hover:-translate-y-1 relative flex flex-col h-full">
                <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold absolute -top-4 -left-2 shadow-md">1</div>
                <Building2 size={32} className="text-blue-600 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">Authorized Disposal Partner</h3>
                <p className="text-xs text-slate-600 mb-4 flex-1">Medicines go only to government-approved biomedical waste facilities (PCB/CPCB guidelines).</p>
                <div className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded w-max mt-auto">VERIFIED FACILITY</div>
              </div>

              {/* Card 2 */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all hover:-translate-y-1 relative flex flex-col h-full">
                <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold absolute -top-4 -left-2 shadow-md">2</div>
                <MapPin size={32} className="text-indigo-600 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">Secure Handover & Live GPS</h3>
                <p className="text-xs text-slate-600 mb-4 flex-1">Live tracking of the batch quantity, date/time, manufacturer details, and GPS transport location.</p>
                <div className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-1 rounded w-max mt-auto">DIGITAL SIGNATURES</div>
              </div>

              {/* Card 3 */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all hover:-translate-y-1 relative flex flex-col h-full">
                <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold absolute -top-4 -left-2 shadow-md">3</div>
                <Flame size={32} className="text-orange-600 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">Destruction at Facility</h3>
                <p className="text-xs text-slate-600 mb-4 flex-1">High-temperature incineration ensuring the physical destruction of active chemical ingredients.</p>
                <div className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-1 rounded w-max mt-auto">CPCB COMPLIANT</div>
              </div>

              {/* Card 4 */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all hover:-translate-y-1 relative flex flex-col h-full">
                <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold absolute -top-4 -left-2 shadow-md">4</div>
                <FileCheck size={32} className="text-teal-600 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">Proof of Destruction</h3>
                <p className="text-xs text-slate-600 mb-4 flex-1">A formal digital destruction certificate is generated with the batch, quantity, and authorized signature.</p>
                <div className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-1 rounded w-max mt-auto">CERTIFICATE ISSUED</div>
              </div>

              {/* Card 5 */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all hover:-translate-y-1 relative flex flex-col h-full">
                <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold absolute -top-4 -left-2 shadow-md">5</div>
                <Key size={32} className="text-emerald-600 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">Linked & Immutable Record</h3>
                <p className="text-xs text-slate-600 mb-4 flex-1">Certificate is mathematically linked to the batch. Status permanently locked to prevent reactivation.</p>
                <div className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded w-max mt-auto">TAMPER-PROOF</div>
              </div>

            </div>
          </section>

          {/* Verification Laptop UI */}
          <section className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl font-extrabold mb-6">Final Verification in System</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Once the destruction is completed, the Live Tracking engine seals the batch profile. If any bad actor attempts to scan or re-enter the destroyed batch QR code into the market, the system strictly blocks it and throws an emergency alert.
              </p>
              
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-start gap-4">
                <ShieldAlert className="text-red-400 shrink-0" size={24} />
                <div>
                  <h4 className="text-red-400 font-bold mb-1">Batch Destroyed — Re-entry Detected</h4>
                  <p className="text-red-200/80 text-sm">This batch has been officially destroyed. It cannot be sold or redistributed under any circumstances.</p>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full relative">
              <div className="bg-slate-800 rounded-lg p-2 border-b-4 border-slate-700 shadow-2xl relative">
                <div className="flex gap-2 mb-3 px-2 pt-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="bg-white rounded p-6 text-slate-900">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="font-bold text-lg">Batch #B-98442</h4>
                      <p className="text-sm text-slate-500">Paracetamol 500mg</p>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <QrCode className="text-slate-800" size={32} />
                    </div>
                  </div>
                  <hr className="mb-4 border-slate-200" />
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Global Status</span>
                      <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">DESTROYED</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Verification</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14}/> Immutable Lock</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Badge */}
          <div className="text-center pb-4">
            <p className="inline-flex items-center justify-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-6 py-3 rounded-full">
              <ShieldCheck size={18} className="text-emerald-500" />
              Complete Transparency from Manufacturer to Destruction
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Infographic;
