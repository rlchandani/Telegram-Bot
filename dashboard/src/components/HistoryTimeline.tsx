'use client';

import { CommandLog } from '@/lib/api';

interface HistoryTimelineProps {
    history: CommandLog[];
    loading?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatDateTime(timestamp: any): { date: string; time: string } {
    if (!timestamp) return { date: 'N/A', time: '' };

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

    if (!dateObj || isNaN(dateObj.getTime())) {
        return { date: 'N/A', time: '' };
    }

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateStr: string;
    if (dateObj.toDateString() === now.toDateString()) {
        dateStr = 'Today';
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
        dateStr = 'Yesterday';
    } else {
        dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return { date: dateStr, time: timeStr };
}

export function HistoryTimeline({ history, loading }: HistoryTimelineProps) {
    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 text-center">
                <div className="animate-pulse text-gray-500 dark:text-slate-400">Loading history...</div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 text-center text-gray-500 dark:text-slate-400">
                No command history found.
            </div>
        );
    }

    return (
        <div className="space-y-0">
            {history.map((log, index) => {
                const { date, time } = formatDateTime(log.timestamp);
                const isLast = index === history.length - 1;

                return (
                    <div key={log.id} className="flex gap-6">
                        {/* Timestamp */}
                        <div className="w-24 flex-shrink-0 text-right pt-2">
                            <div className="text-gray-500 dark:text-slate-400 text-sm">{date},</div>
                            <div className="text-gray-500 dark:text-slate-400 text-sm">{time}</div>
                        </div>

                        {/* Timeline */}
                        <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-gray-400 dark:bg-slate-500 rounded-full mt-3" />
                            {!isLast && <div className="w-0.5 bg-gray-200 dark:bg-slate-700 flex-1 min-h-[60px]" />}
                        </div>

                        {/* Content Card */}
                        <div className="flex-1 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 mb-4">
                            <div className="text-gray-900 dark:text-white font-medium">
                                <span className="font-bold">{log.command}</span>
                                {log.username && <span className="text-gray-500 dark:text-slate-400"> by @{log.username}</span>}
                            </div>
                            <div className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                                {log.chatTitle ? `Issued in ${log.chatTitle}` : 'Issued in Chat'}
                                {log.status === 'failed' && (
                                    <span className="ml-2 text-red-500">• Failed</span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
