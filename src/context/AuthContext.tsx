import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'manufacturer' | 'distributor' | 'pharmacy' | 'disposal';

export interface UserProfile {
  id: string;
  user_id: string;
  role: UserRole;
  full_name: string;
  email: string;
  organization_name: string | null;
  phone: string | null;
  created_at: string;
}

export const DEMO_PROFILES: Record<string, UserProfile> = {
  'demo-disposal': {
    id: 'demo-disp-id',
    user_id: 'demo-disposal',
    role: 'disposal',
    full_name: 'EnviroSafe (Demo Disposal Facility)',
    email: 'disp@demo.com',
    organization_name: 'EnviroSafe Waste Management',
    phone: '555-0004',
    created_at: new Date().toISOString()
  },
  'demo-manufacturer': {
    id: 'demo-mfr-id',
    user_id: 'demo-manufacturer',
    role: 'manufacturer',
    full_name: 'PharmaCorp (Demo Manufacturer)',
    email: 'mfr@demo.com',
    organization_name: 'PharmaCorp Inc.',
    phone: '555-0001',
    created_at: new Date().toISOString()
  },
  'demo-distributor': {
    id: 'demo-dist-id',
    user_id: 'demo-distributor',
    role: 'distributor',
    full_name: 'GlobalLogistics (Demo Distributor)',
    email: 'dist@demo.com',
    organization_name: 'Global Logistics Hub',
    phone: '555-0002',
    created_at: new Date().toISOString()
  },
  'demo-pharmacy': {
    id: 'demo-pharm-id',
    user_id: 'demo-pharmacy',
    role: 'pharmacy',
    full_name: 'CityRx (Demo Pharmacy)',
    email: 'pharm@demo.com',
    organization_name: 'CityRx Pharmacy',
    phone: '555-0003',
    created_at: new Date().toISOString()
  }
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  loginDemo: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  loginDemo: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const demoRole = localStorage.getItem('PHARMAX_DEMO_ROLE');
    if (demoRole && DEMO_PROFILES[`demo-${demoRole}`]) {
      const p = DEMO_PROFILES[`demo-${demoRole}`];
      setProfile(p);
      setUser({ id: p.user_id, email: p.email } as User);
      setSession({ user: { id: p.user_id, email: p.email }, access_token: 'demo' } as Session);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (localStorage.getItem('PHARMAX_DEMO_ROLE')) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      if (!error && data) setProfile(data as UserProfile);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = (role: UserRole) => {
    localStorage.setItem('PHARMAX_DEMO_ROLE', role);
    if (role === 'disposal') {
      window.location.href = '/disposal/destruction';
    } else {
      window.location.href = `/${role}/dashboard`;
    }
  };

  const signOut = async () => {
    if (localStorage.getItem('PHARMAX_DEMO_ROLE')) {
      localStorage.removeItem('PHARMAX_DEMO_ROLE');
      window.location.href = '/login';
      return;
    }
    
    setSession(null);
    setUser(null);
    setProfile(null);
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, loginDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
