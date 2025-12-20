import { useState } from 'react';
import Link from 'next/link';
import { History as HistoryIcon, Ban, CircleCheck, Trash2 } from 'lucide-react';

import { Group, api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ConfirmDialog } from './ConfirmDialog';

interface GroupsTableProps {
    groups: Group[];
    onGroupUpdated: () => void;
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
            <div className="bg-white dark:bg-slate-800/50 border border-gray-400 dark:border-slate-600 rounded-2xl p-8 text-center text-gray-500 dark:text-slate-400">
                No groups found.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800/50 border border-gray-400 dark:border-slate-600 rounded-2xl overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
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
                                            href={`/groups/view?id=${group.chatId ?? group.id}`}
                                            className="flex flex-col items-center text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                            title="View History"
                                        >
                                            <HistoryIcon className="w-5 h-5 mb-1" />
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
                                            type="button"
                                            className={`flex flex-col items-center transition-colors ${group.isBlocked
                                                ? 'text-red-500 hover:text-red-400'
                                                : 'text-yellow-500 hover:text-yellow-400'
                                                }`}
                                        >
                                            {group.isBlocked ? (
                                                <CircleCheck className="w-5 h-5 mb-1" />
                                            ) : (
                                                <Ban className="w-5 h-5 mb-1" />
                                            )}
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
                                            type="button"
                                            className="flex flex-col items-center text-red-500 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5 mb-1" />
                                            <span className="text-[10px]">Delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col divide-y divide-gray-200 dark:divide-slate-700">
                {groups.map((group) => (
                    <div key={group.id} className="p-4 flex flex-col gap-4">
                        <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0 flex-1">
                                <div className="text-base font-bold text-gray-900 dark:text-white truncate">
                                    {group.title || 'Unknown'}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="text-xs font-mono text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                        #{String(group.chatId ?? group.id ?? '').replace('-', '')}
                                    </div>
                                    {group.username && (
                                        <div className="text-xs text-blue-500 dark:text-blue-400 truncate">
                                            @{group.username}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium shrink-0 ${group.isBlocked
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : group.isActive
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                }`}>
                                {group.isBlocked ? 'Blocked' : group.isActive ? 'Active' : 'Inactive'}
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-slate-400">
                            <div>
                                <span className="mr-1">Joined:</span>
                                <span className="font-medium text-gray-700 dark:text-slate-300">
                                    {formatDate(group.joinedAt || group.updatedAt)}
                                </span>
                            </div>
                            {group.lastActionBy && (
                                <div className="text-right">
                                    <span className="mr-1">User:</span>
                                    <span className="font-medium text-gray-700 dark:text-slate-300">
                                        {group.lastActionBy.username || group.lastActionBy.userId}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <Link
                                href={`/groups/view?id=${group.chatId ?? group.id}`}
                                className="flex-1 py-2 flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <HistoryIcon className="w-4 h-4" />
                                History
                            </Link>

                            <button
                                onClick={() => {
                                    setConfirmAction({
                                        type: 'toggle_block',
                                        group,
                                        title: group.isBlocked ? 'Unblock?' : 'Block?',
                                        message: group.isBlocked ? 'Resume bot responses?' : 'Stop bot responses?',
                                        confirmText: group.isBlocked ? 'Unblock' : 'Block',
                                        variant: group.isBlocked ? 'info' : 'warning'
                                    });
                                }}
                                className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${group.isBlocked
                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                    : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
                                    }`}
                            >
                                {group.isBlocked ? (
                                    <CircleCheck className="w-4 h-4" />
                                ) : (
                                    <Ban className="w-4 h-4" />
                                )}
                                {group.isBlocked ? 'Unblock' : 'Block'}
                            </button>

                            <button
                                onClick={() => {
                                    setConfirmAction({
                                        type: 'delete',
                                        group,
                                        title: 'Delete?',
                                        message: 'Delete group and history?',
                                        confirmText: 'Delete',
                                        variant: 'danger'
                                    });
                                }}
                                className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
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
