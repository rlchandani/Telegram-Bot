const admin = require('firebase-admin');
const path = require('path');

// 1. Check for Service Account Key
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error(`
❌ Error: GOOGLE_APPLICATION_CREDENTIALS not set.

To fix this:
1. Go to Firebase Console -> Project Settings -> Service accounts.
2. Generate a new private key (JSON file).
3. Save it as 'service-account.json' in this folder (or anywhere).
4. Run:
   export GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"
   node set-admin.js <your-email>
`);
    process.exit(1);
}

// 2. Initialize App
try {
    // Resolve absolute path if relative
    const keyPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    const serviceAccount = require(keyPath);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    process.exit(1);
}

// 3. Get Email from Args
const email = process.argv[2];
if (!email) {
    console.error('❌ Usage: node set-admin.js <email>');
    process.exit(1);
}

// 4. Set Claim
async function setAdmin() {
    try {
        console.log(`🔍 Looking up user: ${email}...`);
        const user = await admin.auth().getUserByEmail(email);

        console.log(`👤 Found user (UID: ${user.uid}). Setting admin claim...`);
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });

        console.log(`
✅ Success! Admin access granted to ${email}.
   
You may need to sign out and sign back in for the changes to take effect in the dashboard.
`);
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

setAdmin();
