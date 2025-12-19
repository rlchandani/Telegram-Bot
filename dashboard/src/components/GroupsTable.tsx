'use client';

import Link from 'next/link';
import { Group, api } from '@/lib/api';
import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

interface GroupsTableProps {
    groups: Group[];
    onGroupUpdated: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatDate(timestamp: any): string {
    if (!timestamp) return 'N/A';

    let date: Date | null = null;

    if (timestamp._seconds !== undefined) {
        date = new Date(timestamp._seconds * 1000);
    } else if (timestamp.seconds !== undefined) {
        date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
    }

    if (!date || isNaN(date.getTime())) return 'N/A';

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

type ConfirmActionState = {
    type: 'delete' | 'toggle_block';
    group: Group;
    title: string;
    message: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'info';
} | null;

export function GroupsTable({ groups, onGroupUpdated }: GroupsTableProps) {
    const [updating, setUpdating] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<ConfirmActionState>(null);

    const handleToggleBlock = async (group: Group) => {
        if (!group.chatId) return;
        setUpdating(group.id);
        try {
            await api.updateGroup(group.chatId, { isBlocked: !group.isBlocked });
            onGroupUpdated();
        } catch (err) {
            console.error('Failed to update group:', err);
        } finally {
            setUpdating(null);
            setConfirmAction(null);
        }
    };

    const handleDelete = async (group: Group) => {
        if (!group.chatId) return;
        setUpdating(group.id);
        try {
            await api.deleteGroup(group.chatId);
            onGroupUpdated();
        } catch (err) {
            console.error('Failed to delete group:', err);
        } finally {
            setUpdating(null);
            setConfirmAction(null);
        }
    };

    if (groups.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 text-center text-gray-500 dark:text-slate-400">
                No groups found.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                        <tr className="text-gray-500 dark:text-slate-400 text-left">
                            <th className="py-4 px-4 font-medium">Chat ID</th>
                            <th className="py-4 px-4 font-medium">Title</th>
                            <th className="py-4 px-4 font-medium">Join Date</th>
                            <th className="py-4 px-4 font-medium">Last User</th>
                            <th className="py-4 px-4 font-medium text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map((group) => (
                            <tr key={group.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                <td className="py-4 px-4 text-gray-900 dark:text-white font-mono">
                                    #{String(group.chatId ?? group.id ?? '').replace('-', '')}
                                </td>
                                <td className="py-4 px-4">
                                    <div className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]" title={group.title || 'Unknown'}>{group.title || 'Unknown'}</div>
                                    {group.username && (
                                        <div className="text-gray-500 dark:text-slate-400 text-xs text-blue-500 dark:text-blue-400">@{group.username}</div>
                                    )}
                                </td>
                                <td className="py-4 px-4 text-gray-900 dark:text-white">
                                    {formatDate(group.joinedAt || group.updatedAt)}
                                </td>
                                <td className="py-4 px-4 text-gray-900 dark:text-white">
                                    {group.lastActionBy?.username || group.lastActionBy?.userId || 'N/A'}
                                </td>
                                <td className="py-4 px-4">
                                    <div className="flex justify-center items-center gap-3">
                                        <Link
                                            href={`/groups/${group.chatId ?? group.id}`}
                                            className="flex flex-col items-center text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                            title="View History"
                                        >
                                            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-[10px]">History</span>
                                        </Link>

                                        <button
                                            onClick={() => {
                                                setConfirmAction({
                                                    type: 'toggle_block',
                                                    group,
                                                    title: group.isBlocked ? 'Unblock Group?' : 'Block Group?',
                                                    message: group.isBlocked
                                                        ? `Are you sure you want to unblock "${group.title}"? The bot will resume responding to commands.`
                                                        : `Are you sure you want to block "${group.title}"? The bot will ignore all commands from this group.`,
                                                    confirmText: group.isBlocked ? 'Unblock' : 'Block',
                                                    variant: group.isBlocked ? 'info' : 'warning'
                                                });
                                            }}
                                            disabled={updating === group.id || !group.chatId}
                                            title={group.isBlocked ? "Unblock" : "Block"}
                                            className={`flex flex-col items-center transition-colors ${group.isBlocked
                                                ? 'text-red-500 hover:text-red-400'
                                                : 'text-yellow-500 hover:text-yellow-400'
                                                }`}
                                        >
                                            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                {group.isBlocked ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                )}
                                            </svg>
                                            <span className="text-[10px]">
                                                {group.isBlocked ? 'Unblock' : 'Block'}
                                            </span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setConfirmAction({
                                                    type: 'delete',
                                                    group,
                                                    title: 'Delete Group?',
                                                    message: `Are you sure you want to delete "${group.title}"? This action cannot be undone and will remove all stats/history.`,
                                                    confirmText: 'Delete',
                                                    variant: 'danger'
                                                });
                                            }}
                                            disabled={updating === group.id}
                                            title="Delete Group"
                                            className="flex flex-col items-center text-red-500 hover:text-red-600 transition-colors"
                                        >
                                            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            <span className="text-[10px]">Delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                isOpen={!!confirmAction}
                title={confirmAction?.title || ''}
                message={confirmAction?.message || ''}
                confirmText={confirmAction?.confirmText}
                variant={confirmAction?.variant}
                isLoading={updating === confirmAction?.group.id}
                onCancel={() => !updating && setConfirmAction(null)}
                onConfirm={() => {
                    if (confirmAction) {
                        if (confirmAction.type === 'toggle_block') {
                            handleToggleBlock(confirmAction.group);
                        } else {
                            handleDelete(confirmAction.group);
                        }
                    }
                }}
            />
        </div>
    );
}
