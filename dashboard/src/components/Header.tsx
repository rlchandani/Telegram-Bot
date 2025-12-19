'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useAuth } from './AuthProvider';
import { useEffect, useState } from 'react';

export function Header() {
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <header className="bg-white dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/groups" className="flex items-center gap-2 mr-8">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">iRedlof Telegram Bot</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex items-center gap-6 mr-auto">
                        <Link
                            href="/groups"
                            className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                        >
                            Groups
                        </Link>
                        <Link
                            href="/messages"
                            className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                        >
                            Messages
                        </Link>
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        {/* Theme Toggle */}
                        {mounted && (
                            <button
                                onClick={toggleTheme}
                                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                {theme === 'dark' ? (
                                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>
                        )}

                        {/* Logout */}
                        {user && (
                            <button
                                onClick={logout}
                                className="btn btn-secondary text-sm"
                            >
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
