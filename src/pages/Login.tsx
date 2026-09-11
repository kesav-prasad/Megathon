import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Building2, Store, Truck, Home, Factory, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { session, profile, loginDemo } = useAuth();
  
  if (typeof window !== 'undefined') {
    (window as any).loginDemo = loginDemo;
  }

  // If already authenticated and profile is loaded, redirect
  React.useEffect(() => {
    if (session && profile) {
      if (profile.role === 'manufacturer') navigate('/manufacturer/dashboard');
      else if (profile.role === 'distributor') navigate('/distributor/dashboard');
      else if (profile.role === 'pharmacy') navigate('/pharmacy/dashboard');
      else if (profile.role === 'disposal') navigate('/disposal/destruction');
      else if (profile.role === 'disposal') navigate('/disposal/destruction');
    }
  }, [session, profile, navigate]);

  React.useEffect(() => {
    if (session && profile) {
      if (profile.role === 'manufacturer') navigate('/manufacturer/dashboard');
      else if (profile.role === 'distributor') navigate('/distributor/dashboard');
      else if (profile.role === 'pharmacy') navigate('/pharmacy/dashboard');
    }
  }, [session, profile, navigate]);

  const roles = [
    { id: 'pharmacy', title: 'Pharmacy', desc: 'Medical Shop & Retail', icon: Store },
    { id: 'distributor', title: 'Distributor', desc: 'Wholesaler & Logistics', icon: Truck },
    { id: 'manufacturer', title: 'Manufacturer', desc: 'Brand Owner & Production', icon: Building2 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    localStorage.setItem('last_login_email', email);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Successfully logged in!');
      } else {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data.user) {
          // Create profile
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              user_id: data.user.id,
              role: selectedRole,
              full_name: fullName,
              email: email,
              organization_name: organization || null,
            }
          ]);
          if (profileError) throw profileError;
          toast.success('Account created successfully!');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
            <Building2 className="text-emerald-400" size={32} />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Pharma Trace
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Secure Medicine Supply Chain
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full max-w-4xl px-4">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden p-8 md:p-12 border border-slate-200 text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Select Your Role</h3>
          <p className="text-slate-500 mb-10 max-w-lg mx-auto">Choose an environment to enter the demo system. The accounts are pre-configured and securely linked to each other.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                        <button 
              onClick={() => window.loginDemo('pharmacy')}
              className="flex flex-col items-center p-8 border-2 border-emerald-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer group shadow-sm hover:shadow-md"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Store size={40} />
              </div>
              <h4 className="font-bold text-slate-900 text-lg mb-2">Pharmacy</h4>
              <p className="text-sm text-slate-500">CityRx Pharmacy</p>
            </button>

            <button 
              onClick={() => window.loginDemo('disposal')}
              className="flex flex-col items-center p-8 border-2 border-rose-100 rounded-2xl hover:border-rose-500 hover:bg-rose-50 transition-all cursor-pointer group shadow-sm hover:shadow-md"
            >
              <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Flame size={40} />
              </div>
              <h4 className="font-bold text-slate-900 text-lg mb-2">Disposal Facility</h4>
              <p className="text-sm text-slate-500">EnviroSafe Waste</p>
            </button>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-100">
             <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium transition-colors">
               <Home size={18} /> Return to Homepage
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
