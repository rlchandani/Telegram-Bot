#!/bin/bash
set -e

# Configuration
PROJECT_ID="telegram-bot-e91d5"
SA_NAME="github-deploy"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
SECRET_NAME="FIREBASE_SERVICE_ACCOUNT_KEY"
KEY_FILE="sa-key.json"

echo "🚀 Setting up GitHub Secrets for Firebase Deploy..."

# 1. Check/Install GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "📦 GitHub CLI (gh) not found. Installing via Homebrew..."
    brew install gh
fi

# 2. Authenticate GitHub CLI
if ! gh auth status &> /dev/null; then
    echo "🔑 Please login to GitHub..."
    gh auth login
fi

# 3. Create Service Account (if strictly needed, otherwise skip if exists)
echo "☁️  Creating Service Account (if needed)..."
gcloud iam service-accounts create $SA_NAME --display-name "GitHub Action Deploy" --project $PROJECT_ID || true

# 4. Grant Permissions
echo "🛡️  Granting permissions..."
roles=("roles/firebase.admin" "roles/cloudfunctions.developer" "roles/iam.serviceAccountUser" "roles/artifactregistry.admin")
for role in "${roles[@]}"; do
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="$role" \
        --quiet > /dev/null
done

# 5. Generate Key
echo "🔑 Generating key file..."
gcloud iam service-accounts keys create $KEY_FILE --iam-account=$SA_EMAIL --project $PROJECT_ID

# 6. Upload to GitHub
echo "⬆️  Uploading $SECRET_NAME to GitHub Secrets..."
gh secret set $SECRET_NAME < $KEY_FILE

# 7. Cleanup
rm $KEY_FILE
echo "✅ Done! GCP_SA_KEY deployed to GitHub Secrets."
