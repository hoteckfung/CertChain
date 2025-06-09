#!/bin/bash

# Automated Contract Deployment Script
echo "🚀 Starting automated contract deployment..."
echo ""

echo "📋 Step 1: Deploying smart contract..."
node scripts/deploy-contract.js

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi

echo ""
echo "✅ Deployment completed successfully!"