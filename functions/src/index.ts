import 'dotenv/config'; // Load .env before any other imports
import { onRequest } from 'firebase-functions/v2/https';
import { bot } from './bot';

// Define the Cloud Function
// To deploy: firebase deploy --only functions
// To set webhook: curl "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=<YOUR_FUNCTION_URL>"

export const telegramWebhook = onRequest(
    {
        region: "us-central1", // Or your preferred region
        memory: "512MiB",      // Giving a bit more memory for image generation
        timeoutSeconds: 60,
        // secrets: ["TELEGRAM_BOT_TOKEN"] // Uncomment if using Google Secret Manager
    },
    async (req, res) => {
        try {
            // Initialize bot (fetches bot info from Telegram API)
            await bot.init();

            // Handle the update
            await bot.handleUpdate(req.body);

            res.status(200).send('OK');
        } catch (e) {
            console.error('Webhook processing failed:', e);
            res.status(500).send('Internal Server Error');
        }
    }
);
