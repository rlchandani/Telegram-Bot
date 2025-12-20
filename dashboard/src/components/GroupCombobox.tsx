'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Check, X } from 'lucide-react';

import { Group } from '@/lib/api';

interface GroupComboboxProps {
    groups: Group[];
    selectedGroup: Group | null;
    onSelect: (group: Group | null) => void;
    loading?: boolean;
    onSearchChange?: (search: string) => void;
    placeholder?: string;
}

export function GroupCombobox({
    groups,
    selectedGroup,
    onSelect,
    loading = false,
    onSearchChange,
    placeholder = 'Search and select a group...'
}: GroupComboboxProps): React.ReactElement {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Filter groups locally based on search
    const filteredGroups = groups.filter(group =>
        group.title.toLowerCase().includes(search.toLowerCase()) ||
        group.chatId.toString().includes(search) ||
        (group.username?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );

    // Notify parent of search changes for server-side search
    useEffect(() => {
        onSearchChange?.(search);
    }, [search, onSearchChange]);

    // Reset highlight when filtered results change
    useEffect(() => {
        setHighlightedIndex(0);
    }, [filteredGroups.length]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll highlighted item into view
    useEffect(() => {
        if (isOpen && listRef.current) {
            const highlightedItem = listRef.current.children[highlightedIndex] as HTMLElement;
            if (highlightedItem) {
                highlightedItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex, isOpen]);

    const handleSelect = useCallback((group: Group): void => {
        onSelect(group);
        setSearch('');
        setIsOpen(false);
    }, [onSelect]);

    const handleClear = (e: React.MouseEvent): void => {
        e.stopPropagation();
        onSelect(null);
        setSearch('');
        inputRef.current?.focus();
    };

    const handleKeyDown = useCallback((e: React.KeyboardEvent): void => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredGroups.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredGroups[highlightedIndex]) {
                    handleSelect(filteredGroups[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    }, [isOpen, filteredGroups, highlightedIndex, handleSelect]);

    return (
        <div ref={containerRef} className="relative">
            {/* Selected Group Display / Input */}
            <div
                className={`flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-900 border-2 rounded-xl cursor-text transition-colors ${isOpen
                    ? 'border-green-500 ring-2 ring-green-500/20'
                    : 'border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500'
                    }`}
                onClick={() => {
                    setIsOpen(true);
                    inputRef.current?.focus();
                }}
            >
                {selectedGroup && !isOpen ? (
                    // Show selected group
                    <>
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                            <span className="text-lg">📢</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                {selectedGroup.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                ID: {selectedGroup.chatId}
                                {selectedGroup.username && ` • @${selectedGroup.username}`}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            aria-label="Clear selection"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </>
                ) : (
                    // Show search input
                    <>
                        <Search className="w-5 h-5 text-gray-400 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onFocus={() => setIsOpen(true)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            aria-label="Search groups"
                            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
                        />
                        {loading && (
                            <span className="animate-spin block w-5 h-5 border-2 border-gray-300 border-t-green-500 rounded-full shrink-0" />
                        )}
                    </>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-400 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden">
                    <div
                        ref={listRef}
                        className="max-h-64 overflow-y-auto custom-scrollbar"
                        role="listbox"
                    >
                        {filteredGroups.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500 dark:text-slate-400 text-sm">
                                {loading ? 'Searching...' : 'No groups found'}
                            </div>
                        ) : (
                            filteredGroups.map((group, index) => (
                                <button
                                    key={group.chatId}
                                    type="button"
                                    onClick={() => handleSelect(group)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${index === highlightedIndex
                                        ? 'bg-green-50 dark:bg-green-900/20'
                                        : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                        } ${selectedGroup?.chatId === group.chatId
                                            ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
                                            : ''
                                        }`}
                                    role="option"
                                    aria-selected={selectedGroup?.chatId === group.chatId}
                                >
                                    <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                        <span className="text-base">📢</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                                            {group.title}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                            ID: {group.chatId}
                                            {group.username && ` • @${group.username}`}
                                        </p>
                                    </div>
                                    {selectedGroup?.chatId === group.chatId && (
                                        <Check className="w-5 h-5 text-green-500 shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer hint */}
                    <div className="px-4 py-2 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded text-[10px]">↑↓</kbd> to navigate
                        <span className="mx-2">•</span>
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded text-[10px]">Enter</kbd> to select
                        <span className="mx-2">•</span>
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded text-[10px]">Esc</kbd> to close
                    </div>
                </div>
            )}
        </div>
    );
}
