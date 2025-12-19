'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut, Auth } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [auth, setAuth] = useState<Auth | null>(null);

    useEffect(() => {
        try {
            const firebaseAuth = getFirebaseAuth();
            setAuth(firebaseAuth);

            const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
                setUser(user);
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error('Firebase init error:', error);
            setLoading(false);
        }
    }, []);

    const signIn = async (email: string, password: string) => {
        if (!auth) throw new Error('Firebase not initialized');
        await signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        if (!auth) throw new Error('Firebase not initialized');
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
