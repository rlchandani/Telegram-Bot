'use client';

import React, { useEffect } from 'react';

import { useRouter, usePathname } from 'next/navigation';

import { useAuth } from './AuthProvider';

interface AuthGuardProps {
    children: React.ReactNode;
}

/**
 * Protects pages from unauthenticated access.
 * Redirects to /login if user is not authenticated.
 */
export function AuthGuard({ children }: AuthGuardProps): React.ReactElement | null {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
        }
    }, [user, loading, router]);

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-500 dark:text-slate-400">Loading...</div>
            </div>
        );
    }

    // Don't render children until we confirm user is authenticated
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-500 dark:text-slate-400">Redirecting...</div>
            </div>
        );
    }

    return <>{children}</>;
}
