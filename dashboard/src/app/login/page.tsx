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
            <div className="w-full max-w-md p-6 bg-white dark:bg-slate-800/50 shadow-xl border border-gray-400 dark:border-slate-600 rounded-3xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="text-center mb-8">
                        <p className="text-gray-500 dark:text-slate-400 text-sm">
                            Sign in to admin dashboard
                        </p>
                    </div>
                    {error && (
                        <div className="px-4 py-3 rounded-xl text-sm bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                            {error}
                        </div>
                    )}
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium mb-2 text-gray-500 dark:text-slate-400"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            required
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-500 focus:border-gray-400 dark:focus:border-slate-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium mb-2 text-gray-500 dark:text-slate-400"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-500 focus:border-gray-400 dark:focus:border-slate-500 focus:outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 rounded-xl font-medium bg-green-500 text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                        {loading ? "Signing in..." : "Sign In"}
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
