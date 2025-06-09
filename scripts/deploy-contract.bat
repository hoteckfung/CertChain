@echo off
REM Automated Contract Deployment Script for Windows
echo 🚀 Starting automated contract deployment...
echo.

echo 📋 Step 1: Deploying smart contract...
node scripts/deploy-contract.js

if errorlevel 1 (
    echo ❌ Deployment failed. Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ✅ Deployment completed successfully!
echo.
pause