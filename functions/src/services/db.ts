import * as admin from 'firebase-admin';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.GCLOUD_PROJECT || 'demo-test'
    });
}

export const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });
export const GROUPS_COLLECTION = 'groups';

// Fallback for FieldValue in case named import is undefined
const ServerValue = FieldValue ?? admin.firestore.FieldValue;

export interface GroupStats {
    totalMessages: number;
    totalImages: number;
    imagesByType: {
        stock: number;
        weather: number;
    };
}

export interface GroupData {
    readonly chatId: number;
    readonly title: string;
    isActive: boolean;
    readonly joinedAt: Timestamp;
    updatedAt: Timestamp;
    isBlocked?: boolean;
    // Extended details
    type?: string;
    username?: string;
    description?: string;
    memberCount?: number;
    // Activity Tracking
    lastActionBy?: {
        userId: number;
        username?: string;
    };
    // Stats
    stats?: GroupStats;
}

export const GroupService = {
    /**
     * Add or update a group when the bot joins.
     * Returns true if group is active/activated, false if blocked.
     * Note: isBlocked is only set to false on FIRST creation. Updates never change it.
     */
    async addGroup(chatId: number, title: string, details: Partial<GroupData> = {}): Promise<boolean> {
        const groupRef = db.collection(GROUPS_COLLECTION).doc(chatId.toString());
        const doc = await groupRef.get();

        if (doc.exists) {
            const data = doc.data() as GroupData;
            if (data.isBlocked) {
                // Update metadata but KEEP blocked status
                await groupRef.set({
                    title,
                    updatedAt: ServerValue.serverTimestamp(),
                    ...details
                }, { merge: true });
                return false; // BLOCKED
            }

            // Document exists and is NOT blocked -> update metadata only, DON'T touch isBlocked
            await groupRef.set({
                title,
                isActive: true,
                updatedAt: ServerValue.serverTimestamp(),
                ...details
            }, { merge: true });
            return true;
        }

        // First creation -> set isBlocked: false
        await groupRef.set({
            chatId,
            title,
            isActive: true,
            joinedAt: ServerValue.serverTimestamp(),
            updatedAt: ServerValue.serverTimestamp(),
            isBlocked: false,
            ...details
        }, { merge: true });

        return true;
    },

    /**
     * Mark a group as inactive when the bot leaves or is kicked.
     * Note: This sets isActive: false but does NOT touch isBlocked.
     *       Platform admins manually control isBlocked.
     */
    async removeGroup(chatId: number): Promise<void> {
        const groupRef = db.collection(GROUPS_COLLECTION).doc(chatId.toString());

        await groupRef.set({
            isActive: false,
            updatedAt: ServerValue.serverTimestamp()
        }, { merge: true });
    },

    /**
     * Manually toggle the active status via /start or /stop commands.
     * Returns true if status set successfully, false if blocked.
     */
    async setGroupStatus(chatId: number, isActive: boolean): Promise<boolean> {
        const groupRef = db.collection(GROUPS_COLLECTION).doc(chatId.toString());

        if (isActive) {
            // If trying to activate, check if blocked first
            const doc = await groupRef.get();
            if (doc.exists) {
                const data = doc.data() as GroupData;
                if (data.isBlocked) {
                    return false; // Cannot activate a blocked group
                }
            }
        }

        await groupRef.set({
            isActive,
            updatedAt: ServerValue.serverTimestamp()
        }, { merge: true });

        return true;
    },

    /**
     * Check if a group interactions are active.
     * Returns true if active, false otherwise.
     * Also returns true if the chat is a private User chat (chatId > 0).
     */
    async isGroupActive(chatId: number): Promise<boolean> {
        // Always allow Direct Messages (User Chats are positive IDs)
        if (chatId > 0) return true;

        const doc = await db.collection(GROUPS_COLLECTION).doc(chatId.toString()).get();
        if (!doc.exists) {
            // STRICT MODE: Unknown groups are NOT allowed. Must register first via /start
            return false;
        }

        const data = doc.data() as GroupData;

        // Must be active AND not blocked
        return !!data.isActive && !data.isBlocked;
    }
};

export interface CommandLog {
    readonly timestamp: Timestamp;
    readonly chatId: number;
    readonly chatTitle?: string;
    readonly userId: number;
    readonly username?: string;
    readonly command: string;
    readonly status: 'success' | 'failed';
    readonly metadata?: Record<string, unknown>;
}

export const CommandLogService = {
    async logCommand(log: Omit<CommandLog, 'timestamp'>): Promise<void> {
        try {
            const batch = db.batch();

            // 1. Add log to sub-collection: groups/{chatId}/history
            const historyRef = db.collection(GROUPS_COLLECTION)
                .doc(log.chatId.toString())
                .collection('history')
                .doc();

            batch.set(historyRef, {
                ...log,
                timestamp: ServerValue.serverTimestamp()
            });

            // 2. Update parent group info with last action
            const groupRef = db.collection(GROUPS_COLLECTION).doc(log.chatId.toString());
            batch.set(groupRef, {
                updatedAt: ServerValue.serverTimestamp(),
                lastActionBy: {
                    userId: log.userId,
                    username: log.username
                },
                // Optionally update title if provided, just in case
                ...(log.chatTitle ? { title: log.chatTitle } : {})
            }, { merge: true });

            await batch.commit();

        } catch (error) {
            console.error('Failed to log command:', error);
        }
    }
};

// ============================================
// Stats Service - Track bot activity per group
// ============================================

export type ImageType = 'stock' | 'weather';

export const StatsService = {
    /**
     * Increment message count for a group
     */
    async incrementMessageCount(chatId: number): Promise<void> {
        try {
            const groupRef = db.collection(GROUPS_COLLECTION).doc(chatId.toString());
            await groupRef.update({
                'stats.totalMessages': ServerValue.increment(1),
                updatedAt: ServerValue.serverTimestamp()
            });
        } catch (error) {
            // If document doesn't exist, create it with initial stats
            const groupRef = db.collection(GROUPS_COLLECTION).doc(chatId.toString());
            await groupRef.set({
                stats: {
                    totalMessages: 1,
                    totalImages: 0,
                    imagesByType: { stock: 0, weather: 0 }
                },
                updatedAt: ServerValue.serverTimestamp()
            }, { merge: true });
        }
    },

    /**
     * Increment image count for a group (also increments message count)
     */
    async incrementImageCount(chatId: number, imageType: ImageType): Promise<void> {
        try {
            const groupRef = db.collection(GROUPS_COLLECTION).doc(chatId.toString());
            await groupRef.update({
                'stats.totalMessages': ServerValue.increment(1),
                'stats.totalImages': ServerValue.increment(1),
                [`stats.imagesByType.${imageType}`]: ServerValue.increment(1),
                updatedAt: ServerValue.serverTimestamp()
            });
        } catch (error) {
            // If document doesn't exist, create it with initial stats
            const groupRef = db.collection(GROUPS_COLLECTION).doc(chatId.toString());
            const initialImagesByType = { stock: 0, weather: 0, [imageType]: 1 };
            await groupRef.set({
                stats: {
                    totalMessages: 1,
                    totalImages: 1,
                    imagesByType: initialImagesByType
                },
                updatedAt: ServerValue.serverTimestamp()
            }, { merge: true });
        }
    }
};

// ============================================
// Admin Service - Dashboard API Support
// ============================================

export interface GroupListResult {
    groups: (GroupData & { id: string })[];
    total: number;
    hasMore: boolean;
}

export interface HistoryListResult {
    history: (CommandLog & { id: string })[];
    hasMore: boolean;
}

export const AdminService = {
    /**
     * Get all groups with pagination and optional filters
     */
    async getAllGroups(options: {
        limit?: number;
        offset?: number;
        status?: 'active' | 'inactive' | 'blocked' | 'all';
        search?: string;
    } = {}): Promise<GroupListResult> {
        const { limit = 20, offset = 0, status = 'all', search } = options;

        let query = db.collection(GROUPS_COLLECTION)
            .orderBy('updatedAt', 'desc');

        // Status filter
        if (status === 'blocked') {
            query = query.where('isBlocked', '==', true);
        } else if (status === 'active') {
            query = query.where('isActive', '==', true);
        } else if (status === 'inactive') {
            query = query.where('isActive', '==', false);
        }

        const snapshot = await query.get();
        let groups = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() as GroupData
        }));

        // Client-side search (Firestore doesn't support full-text search)
        if (search) {
            const searchLower = search.toLowerCase();
            groups = groups.filter(g =>
                g.title.toLowerCase().includes(searchLower) ||
                g.username?.toLowerCase().includes(searchLower) ||
                g.chatId.toString().includes(search)
            );
        }

        const total = groups.length;
        const paginatedGroups = groups.slice(offset, offset + limit);

        return {
            groups: paginatedGroups,
            total,
            hasMore: offset + limit < total
        };
    },

    /**
     * Get a single group by chatId
     */
    async getGroup(chatId: number): Promise<(GroupData & { id: string }) | null> {
        const doc = await db.collection(GROUPS_COLLECTION).doc(chatId.toString()).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() as GroupData };
    },

    /**
     * Get command history for a group
     */
    async getGroupHistory(chatId: number, options: {
        limit?: number;
        startAfter?: string;
    } = {}): Promise<HistoryListResult> {
        const { limit = 50, startAfter } = options;

        let query = db.collection(GROUPS_COLLECTION)
            .doc(chatId.toString())
            .collection('history')
            .orderBy('timestamp', 'desc')
            .limit(limit + 1);

        if (startAfter) {
            const startDoc = await db.collection(GROUPS_COLLECTION)
                .doc(chatId.toString())
                .collection('history')
                .doc(startAfter)
                .get();
            if (startDoc.exists) {
                query = query.startAfter(startDoc);
            }
        }

        const snapshot = await query.get();
        const history = snapshot.docs.slice(0, limit).map(doc => ({
            id: doc.id,
            ...doc.data() as CommandLog
        }));

        return {
            history,
            hasMore: snapshot.docs.length > limit
        };
    },

    /**
     * Set the blocked status of a group (admin only)
     */
    async setGroupBlocked(chatId: number, isBlocked: boolean): Promise<void> {
        await db.collection(GROUPS_COLLECTION).doc(chatId.toString()).set({
            isBlocked,
            updatedAt: ServerValue.serverTimestamp()
        }, { merge: true });
    },

    /**
     * Get dashboard statistics
     */
    async getStats(): Promise<{
        totalUsers: number;
        activeGroups: number;
        commandsToday: number;
    }> {
        // Get all groups
        const groupsSnapshot = await db.collection(GROUPS_COLLECTION).get();
        const groups = groupsSnapshot.docs.map(doc => doc.data() as GroupData);

        const totalUsers = groups.reduce((sum, g) => sum + (g.memberCount || 0), 0);
        const activeGroups = groups.filter(g => g.isActive && !g.isBlocked).length;

        // Count commands from today across all groups
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let commandsToday = 0;
        for (const doc of groupsSnapshot.docs) {
            const historySnapshot = await db.collection(GROUPS_COLLECTION)
                .doc(doc.id)
                .collection('history')
                .where('timestamp', '>=', today)
                .get();
            commandsToday += historySnapshot.size;
        }

        return { totalUsers, activeGroups, commandsToday };
    }
};
