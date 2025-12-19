# 📊 AI Telegram Bot - Admin Dashboard

A modern, responsive admin dashboard for managing the AI Telegram Bot. Built with Next.js 15, Tailwind CSS, and Firebase Client SDK.

## ✨ Features

- **Group Management**: List, search, and filter registered groups.
- **Detailed Analytics**: View message/image stats per group.
- **Action Control**: Ban/Unban groups and delete history.
- **Strict Security**: Protected routes requiring Firebase Auth + Admin Claim.
- **History Viewer**: Timeline of all bot commands executed in a group.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Auth**: Firebase Authentication (Client SDK)
- **State**: React Hooks + Context API
- **Deployment**: Firebase Hosting (Static Export)

---

## 🚀 Local Development

1.  **Install dependencies**
    ```bash
    npm install
    ```

2.  **Environment Setup**
    Create `.env.local` with your Firebase config:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

   > **Note**: In development, the API client defaults to `http://localhost:5001` (Firebase Emulator). ensure `npm run serve` is running in the `../functions` directory.

---

## 📦 Building & Deployment

This project uses **Next.js Static Export** (`output: 'export'`) to be hosted on Firebase Hosting.

### Build Locally
```bash
npm run build
```
This generates a static `out/` directory.

### Deploy to Firebase
The deployment is handled via the root `firebase.json`.

```bash
# Deploy from root directory
firebase deploy --only hosting
```

---

## 🔐 Authentication & Access

The dashboard is protected. Only users with the `admin` custom claim can access data.

To grant admin access to yourself locally or in production, use the `set-admin.js` script in the `functions/` directory.

```bash
cd ../functions
node set-admin.js your-email@example.com
```
