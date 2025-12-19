import 'dotenv/config'; // Load .env before any other imports
import { onRequest } from 'firebase-functions/v2/https';
import { bot } from './bot';
import { adminApp } from './admin';

// Define the Cloud Function
// To deploy: firebase deploy --only functions
// To set webhook: curl "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=<YOUR_FUNCTION_URL>"

export const telegramWebhook = onRequest(
    {
        region: "us-central1",
        memory: "512MiB",
        timeoutSeconds: 60,
    },
    async (req, res) => {
        try {
            await bot.init();
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (e) {
            console.error('Webhook processing failed:', e);
            res.status(500).send('Internal Server Error');
        }
    }
);

// Admin API - Dashboard backend
export const adminApi = onRequest(
    {
        region: "us-central1",
        memory: "256MiB",
        timeoutSeconds: 30,
    },
    adminApp
);
