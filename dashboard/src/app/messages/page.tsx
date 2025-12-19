'use client';

import { useState, useEffect } from 'react';
import { api, Group } from '@/lib/api';
import { MessageComposer } from '@/components/MessageComposer';
import Link from 'next/link';

export default function MessagesPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [search, setSearch] = useState('');

    // Fetch groups for selector
    useEffect(() => {
        const fetchGroups = async () => {
            setLoading(true);
            try {
                // Fetch active groups, limited to 50 for dropdown
                // TODO: Implement proper search/pagination for dropdown if needed
                const response = await api.getGroups({
                    limit: 50,
                    status: 'all',
                    search: search
                });
                setGroups(response.groups);
            } catch (error) {
                console.error('Failed to fetch groups:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchGroups, 300);
        return () => clearTimeout(debounce);
    }, [search]);

    const selectedGroup = groups.find(g => g.chatId === selectedGroupId);

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Send Messages
            </h1>

            <div className="grid gap-8">
                {/* 1. Group Selector Card */}
                <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        1. Select Group
                    </h2>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl mb-4 text-sm"
                        />

                        {loading && (
                            <div className="absolute right-3 top-2.5">
                                <span className="animate-spin block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full"></span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar">
                        {groups.map((group) => (
                            <button
                                type="button"
                                key={group.chatId}
                                onClick={() => setSelectedGroupId(group.chatId)}
                                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedGroupId === group.chatId
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10 ring-1 ring-green-500'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                    <span className="text-lg">📢</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                        {group.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                        ID: {group.chatId}
                                    </p>
                                </div>
                            </button>
                        ))}
                        {!loading && groups.length === 0 && (
                            <div className="col-span-full text-center py-4 text-gray-500 dark:text-slate-400 text-sm">
                                No active groups found
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Message Composer */}
                {selectedGroupId ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                2. Compose Message
                            </h2>
                            <span className="text-sm text-gray-500 dark:text-slate-400">
                                Sending to: <b className="text-gray-900 dark:text-white">{selectedGroup?.title}</b>
                            </span>
                        </div>
                        <MessageComposer
                            chatId={selectedGroupId}
                            onMessageSent={() => {
                                // Optional: Reset selection or show global toast
                            }}
                        />
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                        <p className="text-gray-500 dark:text-slate-400">
                            Select a group above to start composing
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
