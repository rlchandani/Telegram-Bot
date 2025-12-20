'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams?.get('returnUrl') || '/groups';

    // Redirect to groups if already logged in
    useEffect(() => {
        if (user) {
            // console.log(`[LoginPage] User already logged in (${user.email}). Redirecting to: ${returnUrl}`);
            router.replace(returnUrl);
        }
    }, [user, router, returnUrl]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            router.push(returnUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="bg-white dark:bg-slate-800/50 border border-gray-400 dark:border-slate-600 rounded-3xl p-8">
                <div className="text-center mb-8">
                    <p className="text-gray-500 dark:text-slate-400 text-sm">
                        Sign in to admin dashboard
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="login-email" className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">
                            Email
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input"
                            placeholder="admin@example.com"
                            required
                            aria-describedby={error ? 'login-error' : undefined}
                        />
                    </div>

                    <div>
                        <label htmlFor="login-password" className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">
                            Password
                        </label>
                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input"
                            placeholder="••••••••"
                            required
                            aria-describedby={error ? 'login-error' : undefined}
                        />
                    </div>

                    {error && (
                        <div
                            id="login-error"
                            role="alert"
                            className="text-red-500 text-sm text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20"
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full mt-6"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function LoginPage(): React.ReactElement {
    return (
        <div className="flex items-center justify-center p-4 min-h-[calc(100dvh-9rem)]">
            <Suspense fallback={<div className="animate-pulse text-gray-500">Loading...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
