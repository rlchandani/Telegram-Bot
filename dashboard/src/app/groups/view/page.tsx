'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { User } from 'lucide-react';

import { api, Group, CommandLog } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/components/AuthProvider';
import { HistoryTimeline } from '@/components/HistoryTimeline';
import { MessageComposer } from '@/components/MessageComposer';

function GroupContent(): React.ReactElement {
    const searchParams = useSearchParams();
    const chatIdParam = searchParams.get('id');
    const chatId = chatIdParam ? parseInt(chatIdParam, 10) : 0;
    const { user } = useAuth();

    const [group, setGroup] = useState<Group | null>(null);
    const [history, setHistory] = useState<CommandLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);

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

    const fetchHistory = useCallback(async (): Promise<void> => {
        setHistoryLoading(true);
        try {
            const data = await api.getGroupHistory(chatId, { limit: 50 });
            setHistory(data.history);
        } catch {
            // Silent fail - history will show empty
        } finally {
            setHistoryLoading(false);
        }
    }, [chatId]);

    useEffect(() => {
        if (user && chatId) {
            fetchGroup();
            fetchHistory();
        }
    }, [user, chatId, fetchGroup, fetchHistory]);




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
                        <User className="w-10 h-10 text-blue-400" />
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
                <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 text-sm mb-6">
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


            </div>

            {/* Stats Section */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Group Statistics</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

export default function GroupDetailPage() {
    return (
        <AuthGuard>
            <Suspense fallback={<div className="min-h-screen text-center p-10">Loading...</div>}>
                <GroupContent />
            </Suspense>
        </AuthGuard>
    );
}
