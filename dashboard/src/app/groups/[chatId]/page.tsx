'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { HistoryTimeline } from '@/components/HistoryTimeline';
import { MessageComposer } from '@/components/MessageComposer';
import { api, Group, CommandLog } from '@/lib/api';

interface PageProps {
    params: Promise<{ chatId: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatDate(timestamp: any): string {
    if (!timestamp) return 'N/A';

    let dateObj: Date | null = null;

    if (timestamp._seconds !== undefined) {
        dateObj = new Date(timestamp._seconds * 1000);
    } else if (timestamp.seconds !== undefined) {
        dateObj = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
        dateObj = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
        dateObj = new Date(timestamp);
    }

    if (!dateObj || isNaN(dateObj.getTime())) return 'N/A';

    return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function GroupDetailPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const chatId = parseInt(resolvedParams.chatId);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [group, setGroup] = useState<Group | null>(null);
    const [history, setHistory] = useState<CommandLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');

    const fetchGroup = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getGroup(chatId);
            setGroup(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch group');
        } finally {
            setLoading(false);
        }
    }, [chatId]);

    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const data = await api.getGroupHistory(chatId, { limit: 50 });
            setHistory(data.history);
        } catch (err) {
            console.error('Failed to fetch history:', err);
        } finally {
            setHistoryLoading(false);
        }
    }, [chatId]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && chatId) {
            fetchGroup();
            fetchHistory();
        }
    }, [user, chatId, fetchGroup, fetchHistory]);

    const handleToggleBlock = async () => {
        if (!group) return;
        setUpdating(true);
        try {
            const updated = await api.updateGroup(chatId, { isBlocked: !group.isBlocked });
            setGroup(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update group');
        } finally {
            setUpdating(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-500 dark:text-slate-400">Loading...</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen p-6 md:p-8">
                <div className="animate-pulse text-gray-500 dark:text-slate-400">Loading group...</div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="min-h-screen p-6 md:p-8">
                <div className="text-red-500">Group not found</div>
                <Link href="/groups" className="text-green-500 mt-4 inline-block">
                    ← Back to Groups
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 md:p-8">
            {/* Back link */}
            <Link href="/groups" className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white text-sm mb-6 inline-block">
                ← Back to Groups
            </Link>

            {/* Group Details Card */}
            <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-6">Group Details</h2>

                {/* Avatar */}
                <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                        </svg>
                    </div>
                </div>

                {/* Title & ID */}
                <div className="text-center mb-4">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{group.title}</div>
                    {group.username && (
                        <div className="text-gray-500 dark:text-slate-400 text-sm">@{group.username}</div>
                    )}
                    <div className="text-gray-500 dark:text-slate-400 text-sm font-mono mt-1">
                        {String(group.chatId ?? group.id ?? '').replace('-', '')}
                    </div>
                </div>

                {/* Joined & Status Row */}
                <div className="flex justify-center gap-6 text-sm mb-6">
                    <div>
                        <span className="text-gray-500 dark:text-slate-400">Joined: </span>
                        <span className="text-gray-900 dark:text-white">{formatDate(group.joinedAt || group.updatedAt)}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 dark:text-slate-400">Status: </span>
                        <span className={group.isBlocked ? 'text-red-500' : group.isActive ? 'text-green-500' : 'text-gray-500 dark:text-slate-400'}>
                            {group.isBlocked ? 'Blocked' : group.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="text-red-500 text-sm text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20 mb-4">
                        {error}
                    </div>
                )}

                {/* Restrict Button */}
                <button
                    onClick={handleToggleBlock}
                    disabled={updating}
                    className={`w-full py-3 rounded-full font-medium transition-all ${group.isBlocked
                        ? 'bg-green-500 text-black hover:bg-green-400'
                        : 'bg-red-500 text-white hover:bg-red-400'
                        }`}
                >
                    {updating ? 'Updating...' : group.isBlocked ? 'Unblock Group' : 'Restrict Group'}
                </button>
            </div>

            {/* Stats Section */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Group Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {group.stats?.totalMessages || group['stats.totalMessages'] || 0}
                        </div>
                        <div className="text-gray-500 dark:text-slate-400 text-sm">Bot Responses</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {group.stats?.totalImages || group['stats.totalImages'] || 0}
                        </div>
                        <div className="text-gray-500 dark:text-slate-400 text-sm">Total Images</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-500">
                            {group.stats?.imagesByType?.stock || group['stats.imagesByType.stock'] || 0}
                        </div>
                        <div className="text-gray-500 dark:text-slate-400 text-sm">Stock Cards</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-500">
                            {group.stats?.imagesByType?.weather || group['stats.imagesByType.weather'] || 0}
                        </div>
                        <div className="text-gray-500 dark:text-slate-400 text-sm">Weather Cards</div>
                    </div>
                </div>
            </div>

            {/* Send Message */}
            <div className="mb-8">
                <MessageComposer chatId={chatId} />
            </div>

            {/* History */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Command History</h2>
                <HistoryTimeline history={history} loading={historyLoading} />
            </div>
        </div>
    );
}
