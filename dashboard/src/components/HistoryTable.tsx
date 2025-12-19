'use client';

import { CommandLog } from '@/lib/api';

interface HistoryTableProps {
    history: CommandLog[];
    loading?: boolean;
}

function formatDate(timestamp: { _seconds: number }): string {
    if (!timestamp?._seconds) return 'N/A';
    return new Date(timestamp._seconds * 1000).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function HistoryTable({ history, loading }: HistoryTableProps) {
    if (loading) {
        return (
            <div className="bg-card border border-card-border rounded-2xl p-8 text-center">
                <div className="animate-pulse text-dim">Loading history...</div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="bg-card border border-card-border rounded-2xl p-8 text-center text-dim">
                No command history found.
            </div>
        );
    }

    return (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-bg border-b border-card-border">
                    <tr className="text-dim">
                        <th className="text-left py-3 px-4 font-medium">Time</th>
                        <th className="text-left py-3 px-4 font-medium">User</th>
                        <th className="text-left py-3 px-4 font-medium">Command</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((log) => (
                        <tr key={log.id} className="border-b border-card-border hover:bg-bg/50">
                            <td className="py-3 px-4 text-dim">
                                {formatDate(log.timestamp)}
                            </td>
                            <td className="py-3 px-4 text-main">
                                {log.username || log.userId}
                            </td>
                            <td className="py-3 px-4 text-main font-mono">
                                {log.command}
                            </td>
                            <td className="py-3 px-4">
                                <span className={`px-2 py-1 text-xs rounded-full ${log.status === 'success'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {log.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
