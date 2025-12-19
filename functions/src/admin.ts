import * as admin from 'firebase-admin';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { AdminService, db, GROUPS_COLLECTION } from './services/db';
import { bot } from './bot';
import { InputFile } from 'grammy';

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json({ limit: '100mb' }));

// Auth middleware - verify Firebase ID token and check admin claim
async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Skip auth in emulator mode for local development
    const isEmulator = process.env.GCLOUD_PROJECT === 'demo-test' || process.env.FUNCTIONS_EMULATOR === 'true';
    if (isEmulator) {
        console.log('[DEV] Skipping auth in emulator mode');
        next();
        return;
    }

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: Missing token' });
        return;
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Check for admin custom claim
        if (!decodedToken.admin) {
            res.status(403).json({ error: 'Forbidden: Admin access required' });
            return;
        }

        // Attach user info to request
        (req as Request & { user: admin.auth.DecodedIdToken }).user = decodedToken;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
}

// Apply admin auth to all routes
app.use(requireAdmin);

// ============================================
// API Routes
// ============================================

// GET /groups - List all groups
app.get('/groups', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;
        const status = (req.query.status as 'active' | 'inactive' | 'blocked' | 'all') || 'all';
        const search = req.query.search as string | undefined;

        const result = await AdminService.getAllGroups({ limit, offset, status, search });
        res.json(result);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

// GET /groups/:chatId - Get single group
app.get('/groups/:chatId', async (req: Request, res: Response) => {
    try {
        const chatId = parseInt(req.params.chatId);
        if (isNaN(chatId)) {
            res.status(400).json({ error: 'Invalid chatId' });
            return;
        }

        const group = await AdminService.getGroup(chatId);
        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }

        res.json(group);
    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).json({ error: 'Failed to fetch group' });
    }
});

// GET /groups/:chatId/history - Get command history
app.get('/groups/:chatId/history', async (req: Request, res: Response) => {
    try {
        const chatId = parseInt(req.params.chatId);
        if (isNaN(chatId)) {
            res.status(400).json({ error: 'Invalid chatId' });
            return;
        }

        const limit = parseInt(req.query.limit as string) || 50;
        const startAfter = req.query.startAfter as string | undefined;

        const result = await AdminService.getGroupHistory(chatId, { limit, startAfter });
        res.json(result);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// PATCH /groups/:chatId - Update group (block/unblock)
app.patch('/groups/:chatId', async (req: Request, res: Response) => {
    try {
        const chatId = parseInt(req.params.chatId);
        if (isNaN(chatId)) {
            res.status(400).json({ error: 'Invalid chatId' });
            return;
        }

        const { isBlocked } = req.body;
        if (typeof isBlocked !== 'boolean') {
            res.status(400).json({ error: 'isBlocked must be a boolean' });
            return;
        }

        // Get current status to check for change
        const currentGroup = await AdminService.getGroup(chatId);
        const wasBlocked = currentGroup?.isBlocked ?? false;

        await AdminService.setGroupBlocked(chatId, isBlocked);

        // Send notification if status changed
        if (wasBlocked !== isBlocked) {
            try {
                if (isBlocked) {
                    await bot.api.sendMessage(chatId, '🚫 *Alert:* This group has been blocked by an administrator. The bot will no longer respond to commands.', { parse_mode: 'Markdown' });
                } else {
                    await bot.api.sendMessage(chatId, '✅ *Good news!* This group has been unblocked. I am back online and ready to help! 🤖', { parse_mode: 'Markdown' });
                }
            } catch (err) {
                console.error(`Failed to send block/unblock notification to ${chatId}:`, err);
                // Don't fail the request if message sending fails (e.g. bot kicked)
            }
        }

        const updatedGroup = await AdminService.getGroup(chatId);
        res.json(updatedGroup);
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ error: 'Failed to update group' });
    }
});

// POST /groups/:chatId/message - Send message to group
app.post('/groups/:chatId/message', async (req: Request, res: Response) => {
    try {
        const chatId = parseInt(req.params.chatId);
        if (isNaN(chatId)) {
            res.status(400).json({ error: 'Invalid chatId' });
            return;
        }

        const { type, text, caption, fileData, fileName, mimeType } = req.body;

        if (!type) {
            res.status(400).json({ error: 'Message type is required' });
            return;
        }

        let result;

        switch (type) {
            case 'text':
                if (!text) {
                    res.status(400).json({ error: 'Text is required for text messages' });
                    return;
                }
                result = await bot.api.sendMessage(chatId, text, { parse_mode: 'Markdown' });
                break;

            case 'photo':
                if (!fileData) {
                    res.status(400).json({ error: 'File data is required for photos' });
                    return;
                }
                const photoBuffer = Buffer.from(fileData, 'base64');
                result = await bot.api.sendPhoto(chatId, new InputFile(photoBuffer, fileName || 'image.jpg'), {
                    caption: caption || undefined
                });
                break;

            case 'video':
                if (!fileData) {
                    res.status(400).json({ error: 'File data is required for videos' });
                    return;
                }
                const videoBuffer = Buffer.from(fileData, 'base64');
                result = await bot.api.sendVideo(chatId, new InputFile(videoBuffer, fileName || 'video.mp4'), {
                    caption: caption || undefined
                });
                break;

            case 'document':
                if (!fileData) {
                    res.status(400).json({ error: 'File data is required for documents' });
                    return;
                }
                const docBuffer = Buffer.from(fileData, 'base64');
                result = await bot.api.sendDocument(chatId, new InputFile(docBuffer, fileName || 'file'), {
                    caption: caption || undefined
                });
                break;

            default:
                res.status(400).json({ error: `Unknown message type: ${type}` });
                return;
        }

        res.json({ success: true, messageId: result.message_id });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// GET /stats - Get dashboard statistics
app.get('/stats', async (_req: Request, res: Response) => {
    try {
        const stats = await AdminService.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Health check (no auth required for this one)
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// DELETE /groups/:chatId - Delete a group
app.delete('/groups/:chatId', async (req: Request, res: Response) => {
    try {
        const chatId = parseInt(req.params.chatId);
        if (isNaN(chatId)) {
            res.status(400).json({ error: 'Invalid chatId' });
            return;
        }

        // Delete from Firestore
        await db.collection(GROUPS_COLLECTION).doc(chatId.toString()).delete();

        res.json({ success: true, message: 'Group deleted' });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export const adminApp = app;

