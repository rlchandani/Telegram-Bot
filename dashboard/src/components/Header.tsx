'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';

import { useAuth } from './AuthProvider';

export function Header(): React.ReactElement {
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const isLoginPage = pathname === '/login';
    const isActive = (path: string): boolean => pathname?.startsWith(path) ?? false;

    const navLinks = [
        {
            href: '/groups', label: 'Groups', icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        {
            href: '/messages', label: 'Messages', icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            )
        },
    ];

    return (
        <>
            <header className="bg-white dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2 mr-2 sm:mr-8 shrink-0">
                            <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-none">
                                iRedlof Telegram Bot
                            </span>
                        </div>

                        {/* Desktop Navigation */}
                        {!isLoginPage && (
                            <nav className="hidden sm:flex items-center gap-6 mr-auto">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`text-sm font-medium transition-colors ${isActive(link.href)
                                            ? 'text-gray-900 dark:text-white'
                                            : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>
                        )}

                        {/* Right side */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Theme Toggle */}
                            {mounted && (
                                <button
                                    type="button"
                                    onClick={toggleTheme}
                                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
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
                            {user && !isLoginPage && (
                                <button
                                    type="button"
                                    onClick={logout}
                                    className="p-2 rounded-xl bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500"
                                    title="Logout"
                                    aria-label="Logout"
                                >
                                    <LogOut size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Navigation */}
            {!isLoginPage && (
                <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-around items-center h-16 z-50 px-2 pb-safe">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive(link.href)
                                ? 'text-blue-500 dark:text-blue-400'
                                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                                }`}
                        >
                            {link.icon}
                            <span className="text-[10px] font-medium">{link.label}</span>
                        </Link>
                    ))}
                </nav>
            )}
        </>
    );
}
