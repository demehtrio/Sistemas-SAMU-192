import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'servidor' | 'coordenacao';
  registration?: string; // CRM/COREN/MATRICULA
  password?: string;
  createdAt: string;
  cargo?: string;
  base?: string;
  cpf?: string;
  coren?: string;
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  quotaExceeded: boolean;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => boolean;
  register: (userData: Omit<UserProfile, 'uid' | 'createdAt'>) => boolean;
  updateProfile: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  quotaExceeded: false,
  signOut: async () => {},
  login: () => false,
  register: () => false,
  updateProfile: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionActive = localStorage.getItem('samu_session_active');
    const currentUserEmail = localStorage.getItem('samu_current_user_email');
    const users = JSON.parse(localStorage.getItem('samu_registered_users') || '[]');

    if (sessionActive === 'true' && currentUserEmail) {
      const user = users.find((u: UserProfile) => u.email === currentUserEmail);
      if (user) {
        setProfile(user);
      } else {
        localStorage.removeItem('samu_session_active');
        localStorage.removeItem('samu_current_user_email');
      }
    }
    
    setLoading(false);
  }, []);

  const signOut = async () => {
    localStorage.removeItem('samu_session_active');
    localStorage.removeItem('samu_current_user_email');
    setProfile(null);
  };

  const login = (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('samu_registered_users') || '[]');
    const user = users.find((u: UserProfile) => u.email === email && u.password === password);
    
    if (user) {
      localStorage.setItem('samu_session_active', 'true');
      localStorage.setItem('samu_current_user_email', email);
      setProfile(user);
      return true;
    }
    return false;
  };

  const register = (userData: Omit<UserProfile, 'uid' | 'createdAt'>) => {
    const users = JSON.parse(localStorage.getItem('samu_registered_users') || '[]');
    
    if (users.find((u: UserProfile) => u.email === userData.email)) {
      return false; // Email already taken
    }

    const newUser: UserProfile = {
      ...userData,
      uid: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('samu_registered_users', JSON.stringify(updatedUsers));
    return true;
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!profile) return;
    const updatedProfile = { ...profile, ...data };
    setProfile(updatedProfile);
    
    // Update in users list
    const users = JSON.parse(localStorage.getItem('samu_registered_users') || '[]');
    const updatedUsers = users.map((u: UserProfile) => u.uid === profile.uid ? updatedProfile : u);
    localStorage.setItem('samu_registered_users', JSON.stringify(updatedUsers));
  };

  const user = profile ? { uid: profile.uid, email: profile.email, displayName: profile.name } : null;

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      quotaExceeded: false, 
      signOut,
      login,
      register,
      updateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
