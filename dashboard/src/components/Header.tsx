'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { LogOut, Moon, Sun, Users, MessageSquare } from 'lucide-react';

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
            href: '/groups', label: 'Groups', icon: <Users size={24} />
        },
        {
            href: '/messages', label: 'Messages', icon: <MessageSquare size={24} />
        },
    ];

    return (
        <>
            <header className="bg-white dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2 mr-2 sm:mr-8 shrink-0">
                            <Link href="/groups" className="flex items-center gap-2">
                                <Image
                                    src="/logo.png"
                                    alt="iRedlof Telegram Bot"
                                    width={32}
                                    height={32}
                                    className="h-8 w-auto"
                                    priority
                                />
                                <span className="font-bold text-xl text-gray-900 dark:text-white">Telegram Bot</span>
                            </Link>
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
                                    className="p-2 rounded-xl bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500"
                                >
                                    {theme === 'dark' ? (
                                        <Sun size={18} className="text-yellow-400" />
                                    ) : (
                                        <Moon size={18} className="text-blue-500" />
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
