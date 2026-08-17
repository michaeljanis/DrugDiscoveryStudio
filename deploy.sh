#!/bin/bash
# Project Episteme Google Cloud Run Deployment Script

set -e

# Load local .env if available
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
  echo "Error: No Google Cloud Project ID detected."
  exit 1
fi

echo "================================================="
echo "PROJECT EPISTEME: CLOUD DEPLOYMENT INITIALIZATION"
echo "================================================="
echo "Cloud Project Target: $PROJECT_ID"
echo "Service Name:         catalyst-ai"
echo "Region:               us-central1"
echo "================================================="

# Submit build to Google Cloud Build using cloudbuild.yaml
echo "Step 1: Submitting container build to Cloud Build..."
gcloud builds submit --config=cloudbuild.yaml .

# Deploy container image to Google Cloud Run (catalyst-ai -> drugdiscovery.studio)
echo "Step 2: Deploying container to Google Cloud Run (catalyst-ai -> drugdiscovery.studio)..."
gcloud run deploy catalyst-ai \
  --image gcr.io/"$PROJECT_ID"/episteme:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --cpu 4 \
  --memory 8Gi \
  --set-env-vars="GEMINI_API_KEY=${GEMINI_API_KEY},STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY},STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY},GMAIL_USER=${GMAIL_USER},GMAIL_APP_PASSWORD=${GMAIL_APP_PASSWORD}"

echo "================================================="
echo "PROJECT EPISTEME CLOUD DEPLOYMENT COMPLETED!"
echo "Service live at: https://drugdiscovery.studio"
echo "================================================="
