'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { api, Group } from '@/lib/api';
import { AuthGuard } from '@/components/AuthGuard';
import { GroupCombobox } from '@/components/GroupCombobox';
import { MessageComposer } from '@/components/MessageComposer';

export default function MessagesPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const searchTimeout = useRef<NodeJS.Timeout>(undefined);

    // Fetch groups for selector
    const fetchGroups = useCallback(async (search: string = ''): Promise<void> => {
        setLoading(true);
        try {
            const response = await api.getGroups({
                limit: 50,
                status: 'all',
                search: search || undefined
            });
            setGroups(response.groups);
        } catch {
            // Silent fail - groups will show empty
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    // Debounced search handler
    const handleSearchChange = useCallback((search: string): void => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
        searchTimeout.current = setTimeout(() => {
            fetchGroups(search);
        }, 300);
    }, [fetchGroups]);

    return (
        <AuthGuard>
            <div className="min-h-screen p-4 md:p-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    Send Messages
                </h1>

                <div className="grid gap-8">
                    {/* 1. Group Selector Card */}
                    <div className="bg-white dark:bg-slate-800/50 border border-gray-400 dark:border-slate-600 rounded-2xl p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            1. Select Group
                        </h2>

                        <GroupCombobox
                            groups={groups}
                            selectedGroup={selectedGroup}
                            onSelect={setSelectedGroup}
                            loading={loading}
                            onSearchChange={handleSearchChange}
                            placeholder="Search by name, username, or chat ID..."
                        />

                        {/* Quick stats */}
                        {!selectedGroup && groups.length > 0 && (
                            <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
                                {groups.length} groups available
                            </p>
                        )}
                    </div>

                    {/* 2. Message Composer */}
                    {selectedGroup ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    2. Compose Message
                                </h2>
                                <span className="text-sm text-gray-500 dark:text-slate-400">
                                    Sending to: <b className="text-gray-900 dark:text-white">{selectedGroup.title}</b>
                                </span>
                            </div>
                            <MessageComposer
                                chatId={selectedGroup.chatId}
                                onMessageSent={() => {
                                    // Optional: Reset selection or show global toast
                                }}
                            />
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-gray-400 dark:border-slate-600">
                            <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-gray-500 dark:text-slate-400">
                                Select a group above to start composing
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}
