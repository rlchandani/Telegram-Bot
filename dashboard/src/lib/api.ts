import { getFirebaseAuth } from './firebase';

// Auto-derive API URL based on environment
const getApiBaseUrl = (): string => {
    // 1. Explicit override always wins
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) return '';

    // 2. Local development: use emulator
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
        // Fallback to demo-test if using default emulator setup, regardless of strict project ID
        return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/demo-test/us-central1/adminApi';
    }

    // 3. Production: use Cloud Functions
    return `https://us-central1-${projectId}.cloudfunctions.net/adminApi`;
};

async function getAuthToken(): Promise<string> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return user.getIdToken();
}

async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getAuthToken();

    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
}

// Group Types
export interface GroupStats {
    totalMessages: number;
    totalImages: number;
    imagesByType: {
        stock: number;
        weather: number;
    };
}

export interface Group {
    id: string;
    chatId: number;
    title: string;
    isActive: boolean;
    isBlocked?: boolean;
    type?: string;
    username?: string;
    description?: string;
    memberCount?: number;
    joinedAt: { _seconds: number };
    updatedAt: { _seconds: number };
    lastActionBy?: {
        userId: number;
        username?: string;
    };
    stats?: GroupStats;
    // Flat field names from Firestore (when using dot notation with set/merge)
    'stats.totalMessages'?: number;
    'stats.totalImages'?: number;
    'stats.imagesByType.stock'?: number;
    'stats.imagesByType.weather'?: number;
}

export interface GroupListResponse {
    groups: Group[];
    total: number;
    hasMore: boolean;
}

export interface CommandLog {
    id: string;
    chatId: number;
    chatTitle?: string;
    userId: number;
    username?: string;
    command: string;
    status: 'success' | 'failed';
    timestamp: { _seconds: number };
}

export interface HistoryResponse {
    history: CommandLog[];
    hasMore: boolean;
}

// API Functions
export type MessageType = 'text' | 'photo' | 'video' | 'document';

export const api = {
    async getGroups(params: {
        limit?: number;
        offset?: number;
        status?: 'active' | 'inactive' | 'blocked' | 'all';
        search?: string;
    } = {}): Promise<GroupListResponse> {
        const searchParams = new URLSearchParams();
        if (params.limit) searchParams.set('limit', params.limit.toString());
        if (params.offset) searchParams.set('offset', params.offset.toString());
        if (params.status) searchParams.set('status', params.status);
        if (params.search) searchParams.set('search', params.search);

        const query = searchParams.toString();
        return apiRequest<GroupListResponse>(`/groups${query ? `?${query}` : ''}`);
    },

    async getGroup(chatId: number): Promise<Group> {
        return apiRequest<Group>(`/groups/${chatId}`);
    },

    async getGroupHistory(chatId: number, params: {
        limit?: number;
        startAfter?: string;
    } = {}): Promise<HistoryResponse> {
        const searchParams = new URLSearchParams();
        if (params.limit) searchParams.set('limit', params.limit.toString());
        if (params.startAfter) searchParams.set('startAfter', params.startAfter);

        const query = searchParams.toString();
        return apiRequest<HistoryResponse>(`/groups/${chatId}/history${query ? `?${query}` : ''}`);
    },

    async updateGroup(chatId: number, data: { isBlocked: boolean }): Promise<Group> {
        return apiRequest<Group>(`/groups/${chatId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async getStats(): Promise<{
        totalUsers: number;
        activeGroups: number;
        commandsToday: number;
    }> {
        return apiRequest('/stats');
    },

    async sendMessage(chatId: number, data: {
        type: MessageType;
        text?: string;
        caption?: string;
        fileData?: string;
        fileName?: string;
        mimeType?: string;
    }): Promise<{ success: boolean; messageId: number }> {
        return apiRequest(`/groups/${chatId}/message`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async deleteGroup(chatId: number): Promise<void> {
        return apiRequest(`/groups/${chatId}`, {
            method: 'DELETE',
        });
    },
};
