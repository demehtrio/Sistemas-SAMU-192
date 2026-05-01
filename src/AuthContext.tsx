import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, signInWithGoogle as firebaseSignInWithGoogle } from './lib/firebase';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'servidor' | 'coordenacao';
  registration?: string; // CRM/COREN/MATRICULA
  createdAt: any;
  cargo?: string;
  base?: string;
  cpf?: string;
  coren?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  quotaExceeded: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  registerProfile: (userData: Omit<UserProfile, 'uid' | 'createdAt'>) => Promise<boolean>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  quotaExceeded: false,
  signOut: async () => {},
  signInWithGoogle: async () => {},
  registerProfile: async () => false,
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    // Listen for custom quota-exceeded events
    const handleQuotaError = () => setQuotaExceeded(true);
    window.addEventListener('firestore-quota-exceeded', handleQuotaError);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const signInWithGoogle = async () => {
    try {
      await firebaseSignInWithGoogle();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const registerProfile = async (userData: Omit<UserProfile, 'uid' | 'createdAt'>) => {
    if (!user) return false;

    try {
      const profileData: UserProfile = {
        ...userData,
        uid: user.uid,
        email: user.email!,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', user.uid), profileData);
      setProfile(profileData);
      return true;
    } catch (error) {
      console.error('Error registering profile:', error);
      return false;
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, data);
      setProfile({ ...profile, ...data });
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      quotaExceeded,
      signOut,
      signInWithGoogle,
      registerProfile,
      updateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
