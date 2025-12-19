'use client';

import Link from 'next/link';
import { Group } from '@/lib/api';
import { StatusBadge } from './StatusBadge';

interface GroupCardProps {
    group: Group;
}

function formatDate(timestamp: { _seconds: number }): string {
    if (!timestamp?._seconds) return 'N/A';
    return new Date(timestamp._seconds * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function GroupCard({ group }: GroupCardProps) {
    return (
        <Link href={`/groups/${group.chatId}`}>
            <div className="bg-card border border-card-border rounded-2xl p-6 hover:border-gray-600 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-main truncate">
                            {group.title}
                        </h3>
                        {group.username && (
                            <p className="text-sm text-dim">@{group.username}</p>
                        )}
                    </div>
                    <StatusBadge group={group} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-dim">Chat ID:</span>
                        <span className="ml-2 text-main font-mono">{group.chatId}</span>
                    </div>
                    <div>
                        <span className="text-dim">Members:</span>
                        <span className="ml-2 text-main">{group.memberCount || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="text-dim">Type:</span>
                        <span className="ml-2 text-main capitalize">{group.type || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="text-dim">Updated:</span>
                        <span className="ml-2 text-main">{formatDate(group.updatedAt)}</span>
                    </div>
                </div>

                {group.lastActionBy && (
                    <div className="mt-4 pt-4 border-t border-card-border text-sm text-dim">
                        Last action by: <span className="text-main">{group.lastActionBy.username || group.lastActionBy.userId}</span>
                    </div>
                )}
            </div>
        </Link>
    );
}
