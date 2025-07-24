"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Define the shape of the user's claims
export interface UserClaims {
  [key: string]: boolean;
}

// Update the context type to hold user and claims separately
interface AuthContextType {
  user: User | null;
  claims: UserClaims | null; // <-- Claims are now separate
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  claims: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<UserClaims | null>(null); // <-- New state for claims
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in. Set the original User object.
        setUser(firebaseUser);

        // Get the token and set the claims separately.
        const tokenResult = await firebaseUser.getIdTokenResult();
        setClaims(tokenResult.claims as UserClaims);
      } else {
        // User is signed out, clear everything.
        setUser(null);
        setClaims(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, claims, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};