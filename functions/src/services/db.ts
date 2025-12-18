import * as admin from 'firebase-admin';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.GCLOUD_PROJECT || 'demo-test'
    });
}

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });
const GROUPS_COLLECTION = 'groups';

// Fallback for FieldValue in case named import is undefined
const ServerValue = FieldValue ?? admin.firestore.FieldValue;

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
            // New interaction from unknown group -> assume active permit
            return true;
        }

        const data = doc.data() as GroupData;
        return !!data.isActive;
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
