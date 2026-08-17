#!/bin/bash
# Project Episteme Database Base Image Deployment Script

set -e

# Retrieve active project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
  echo "Error: No Google Cloud Project ID detected. Please configure one using:"
  echo "gcloud config set project <PROJECT_ID>"
  exit 1
fi

echo "================================================="
echo "PROJECT EPISTEME: DATABASE BUILD INITIALIZATION"
echo "================================================="
echo "Cloud Project Target: $PROJECT_ID"
echo "Image Name:           gcr.io/$PROJECT_ID/episteme-db-base:latest"
echo "================================================="

# Submit build to Google Cloud Build using cloudbuild-db.yaml
echo "Step 1: Submitting database container build to Cloud Build..."
gcloud builds submit --config=cloudbuild-db.yaml .

echo "================================================="
echo "PROJECT EPISTEME DATABASE BUILD COMPLETED!"
echo "================================================="
echo "You can now run deploy.sh to deploy the application."
