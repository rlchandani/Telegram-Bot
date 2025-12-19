'use client';

import { useState, useRef, useCallback } from 'react';
import { api, MessageType } from '@/lib/api';

interface MessageComposerProps {
    chatId: number;
    onMessageSent?: () => void;
}



interface QueueItem {
    id: string;
    file: File;
    type: MessageType;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

const validateFile = (file: File): { valid: boolean; error?: string; type: MessageType } => {
    let type: MessageType = 'document';
    let limitMB = 50;

    if (file.type.startsWith('image/')) {
        type = 'photo';
        limitMB = 10;
    } else if (file.type.startsWith('video/')) {
        type = 'video';
        limitMB = 50;
    }

    const maxSize = limitMB * 1024 * 1024;
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `Too large (Max ${limitMB}MB)`,
            type
        };
    }

    return { valid: true, type };
};

export function MessageComposer({ chatId, onMessageSent }: MessageComposerProps) {
    const [activeTab, setActiveTab] = useState<'compose' | 'upload'>('compose');

    // Compose State (Text)
    const [text, setText] = useState('');
    const [sendingText, setSendingText] = useState(false);
    const [textError, setTextError] = useState('');
    const [textSuccess, setTextSuccess] = useState('');

    // Upload State (Files)
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessingQueue, setIsProcessingQueue] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Text Messaging Logic ---

    const handleSendText = async () => {
        if (!text.trim()) {
            setTextError('Please enter a message');
            return;
        }

        setSendingText(true);
        setTextError('');
        setTextSuccess('');

        try {
            await api.sendMessage(chatId, { type: 'text', text });
            setTextSuccess('Message sent!');
            setText('');
            onMessageSent?.();
        } catch (err) {
            setTextError(err instanceof Error ? err.message : 'Failed to send');
        } finally {
            setSendingText(false);
        }
    };

    // --- File Upload Logic ---

    const addFilesToQueue = useCallback((files: FileList | File[]) => {
        const newItems: QueueItem[] = [];

        Array.from(files).forEach(file => {
            const { valid, error, type } = validateFile(file);
            newItems.push({
                id: Math.random().toString(36).substr(2, 9),
                file,
                type,
                status: valid ? 'pending' : 'error',
                error
            });
        });

        setQueue(prev => [...prev, ...newItems]);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length) {
            addFilesToQueue(e.dataTransfer.files);
        }
    }, [addFilesToQueue]);

    const removeQueueItem = (id: string) => {
        setQueue(prev => prev.filter(item => item.id !== id));
    };

    const processQueue = async () => {
        if (isProcessingQueue) return;
        setIsProcessingQueue(true);

        // Process only pending items
        const pendingItems = queue.filter(item => item.status === 'pending');

        for (const item of pendingItems) {
            // Update status to uploading
            setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading' } : i));

            try {
                // Convert to base64
                const reader = new FileReader();
                const fileData = await new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(item.file);
                });

                await api.sendMessage(chatId, {
                    type: item.type,
                    fileData,
                    fileName: item.file.name,
                    mimeType: item.file.type || 'application/octet-stream',
                    caption: item.file.name // Optional: use filename as caption
                });

                // Success
                setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'success' } : i));
                onMessageSent?.();
            } catch (err) {
                // Error
                let errorMessage = err instanceof Error ? err.message : 'Upload failed';
                if (errorMessage === 'Failed to fetch') {
                    errorMessage = 'Network timeout/Size limit';
                }
                setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: errorMessage } : i));
            }
        }

        setIsProcessingQueue(false);
    };

    const clearFinished = () => {
        setQueue(prev => prev.filter(item => item.status === 'pending' || item.status === 'uploading'));
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 border border-gray-400 dark:border-slate-600 rounded-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-slate-700">
                <button
                    type="button"
                    onClick={() => setActiveTab('compose')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'compose'
                        ? 'bg-white dark:bg-slate-800 text-green-500 border-b-2 border-green-500'
                        : 'bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                        }`}
                >
                    Write Message
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'upload'
                        ? 'bg-white dark:bg-slate-800 text-green-500 border-b-2 border-green-500'
                        : 'bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                        }`}
                >
                    Upload Files
                </button>
            </div>

            <div className="p-6">
                {activeTab === 'compose' ? (
                    // --- Text Composer ---
                    <div className="space-y-4">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter your message (Markdown supported)..."
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                            rows={4}
                        />

                        {(textError || textSuccess) && (
                            <div className={`text-sm p-3 rounded-lg border ${textError
                                ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                : 'bg-green-500/10 border-green-500/20 text-green-500'
                                }`}>
                                {textError || textSuccess}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleSendText}
                            disabled={sendingText || !text.trim()}
                            className="w-full py-3 bg-green-500 text-black font-medium rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sendingText ? 'Sending...' : 'Send Message'}
                        </button>
                    </div>
                ) : (
                    // --- File Upload ---
                    <div className="space-y-6">
                        {/* Drop Zone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            aria-label="Upload file"
                            className={`border border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragging
                                ? 'border-green-500 bg-green-500/10'
                                : 'border-gray-300 dark:border-slate-600 hover:border-green-500 dark:hover:border-green-500 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => e.target.files && addFilesToQueue(e.target.files)}
                            />
                            <div className="flex flex-col items-center gap-2">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-500">
                                    Photos (max 10MB), Videos/Files (max 50MB)
                                </p>
                            </div>
                        </div>

                        {/* Queue List */}
                        {queue.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <h4 className="font-medium text-gray-900 dark:text-white">File Queue ({queue.length})</h4>
                                    {queue.some(i => i.status === 'success' || i.status === 'error') && (
                                        <button
                                            type="button"
                                            onClick={clearFinished}
                                            className="text-gray-500 hover:text-gray-700 dark:hover:text-slate-300"
                                        >
                                            Clear Finished
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {queue.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border ${item.status === 'error' ? 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800' :
                                                item.status === 'success' ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800' :
                                                    'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'photo' ? 'bg-purple-100 text-purple-600' :
                                                    item.type === 'video' ? 'bg-blue-100 text-blue-600' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {item.type === 'photo' ? '🖼️' : item.type === 'video' ? '🎥' : '📄'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-700 dark:text-slate-200 truncate max-w-[200px]">
                                                        {item.file.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-500">
                                                        {(item.file.size / 1024 / 1024).toFixed(1)} MB • {
                                                            item.status === 'pending' ? 'Ready' :
                                                                item.status === 'uploading' ? 'Sending...' :
                                                                    item.status === 'success' ? 'Sent' :
                                                                        item.error || 'Failed'
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {item.status === 'pending' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeQueueItem(item.id)}
                                                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-400 hover:text-red-500"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                                {item.status === 'uploading' && <span className="animate-spin">🔄</span>}
                                                {item.status === 'success' && <span className="text-green-500">✅</span>}
                                                {item.status === 'error' && (
                                                    <button
                                                        onClick={() => removeQueueItem(item.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={processQueue}
                                    disabled={isProcessingQueue || !queue.some(i => i.status === 'pending')}
                                    className="w-full py-3 bg-green-500 text-black font-medium rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessingQueue ? 'Sending...' : `Send ${queue.filter(i => i.status === 'pending').length} Files`}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
