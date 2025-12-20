'use client';

import { useEffect, useState, useCallback } from 'react';

import { api, Group } from '@/lib/api';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/components/AuthProvider';
import { GroupsTable } from '@/components/GroupsTable';
import { StatisticCard } from '@/components/StatisticCard';

type StatusFilter = 'all' | 'active' | 'inactive' | 'blocked';

interface Stats {
    totalUsers: number;
    activeGroups: number;
    commandsToday: number;
}

export default function GroupsPage() {
    const { user } = useAuth();

    const [groups, setGroups] = useState<Group[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState<Stats | null>(null);

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<StatusFilter>('all');
    const [page, setPage] = useState(0);
    const limit = 12;

    const fetchGroups = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const result = await api.getGroups({
                limit,
                offset: page * limit,
                status,
                search: search || undefined,
            });
            setGroups(result.groups);
            setTotal(result.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch groups');
        } finally {
            setLoading(false);
        }
    }, [page, status, search]);

    const fetchStats = useCallback(async (): Promise<void> => {
        try {
            const data = await api.getStats();
            setStats(data);
        } catch {
            // Silent fail - stats will show 0
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchGroups();
            fetchStats();
        }
    }, [user, fetchGroups, fetchStats]);

    const handleSearch = (e: React.FormEvent): void => {
        e.preventDefault();
        setPage(0);
        fetchGroups();
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <AuthGuard>
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">

                {/* Stats Cards */}
                <div className="flex gap-3 overflow-x-auto pb-2 mb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3">
                    <StatisticCard
                        label="Total Users"
                        value={stats?.totalUsers ?? 0}
                    />
                    <StatisticCard
                        label="Active Groups"
                        value={stats?.activeGroups ?? 0}
                    />
                    <StatisticCard
                        label="Commands"
                        value={stats?.commandsToday ?? 0}
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <form onSubmit={handleSearch} className="flex-1">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, username, or chat ID..."
                            className="input"
                        />
                    </form>

                    <div className="flex flex-wrap gap-2">
                        {(['all', 'active', 'inactive', 'blocked'] as StatusFilter[]).map((s) => (
                            <button
                                type="button"
                                key={s}
                                onClick={() => { setStatus(s); setPage(0); }}
                                className={`btn flex-1 sm:flex-none ${status === s ? 'btn-primary' : 'btn-secondary'} capitalize text-sm px-3 py-2`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="text-gray-500 dark:text-slate-400 text-sm mb-4">
                    Showing {groups.length} of {total} groups
                </div>

                {/* Error */}
                {error && (
                    <div className="text-red-500 text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20 mb-4">
                        {error}
                    </div>
                )}

                {/* Groups Table */}
                {loading ? (
                    <div className="bg-white dark:bg-slate-800/50 border border-gray-400 dark:border-slate-600 rounded-2xl p-8">
                        <div className="animate-pulse text-gray-500 dark:text-slate-400 text-center">Loading groups...</div>
                    </div>
                ) : (
                    <GroupsTable groups={groups} onGroupUpdated={fetchGroups} />
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="btn btn-secondary disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="btn btn-secondary pointer-events-none">
                            Page {page + 1} of {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="btn btn-secondary disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </AuthGuard>
    );
}
