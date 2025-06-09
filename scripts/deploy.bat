@echo off
REM 🚀 CertChain Deployment Script (Windows)
REM This script automates the deployment of your blockchain certificate system
REM Smart contracts must be deployed manually (see README.md for instructions)

setlocal enabledelayedexpansion

echo Starting CertChain Deployment...
echo.

REM Handle command line arguments
if "%1"=="--help" goto :help
if "%1"=="-h" goto :help
if "%1"=="--health" goto :health_check
if "%1"=="--logs" goto :show_logs
if "%1"=="--stop" goto :stop_services
goto :main_deployment

:help
echo CertChain Docker Deployment Script
echo.
echo Usage: scripts\deploy.bat [options]
echo.
echo Options:
echo   --help, -h     Show this help message
echo   --logs         Show application logs
echo   --health       Check application health
echo   --stop         Stop all Docker services
echo.
echo Note: Smart contracts must be deployed manually using Ganache GUI
echo See README.md for complete deployment instructions
pause
exit /b 0

:health_check
echo Checking application health...
curl -s http://localhost:3000/api/health
echo.
pause
exit /b 0

:show_logs
docker-compose logs -f
exit /b 0

:stop_services
echo [INFO] Stopping all Docker services...
docker-compose down
echo [SUCCESS] All Docker services stopped
echo [INFO] Note: This does not stop Ganache GUI if running separately
pause
exit /b 0

:main_deployment

REM Check if Docker is installed
echo [INFO] Step 1: Checking prerequisites...
echo [INFO] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    echo Visit: https://docs.docker.com/desktop/windows/
    pause
    exit /b 1
)
echo [SUCCESS] Docker is installed

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Desktop first.
    echo Visit: https://docs.docker.com/desktop/windows/
    pause
    exit /b 1
)
echo [SUCCESS] Docker Compose is installed
echo.

REM Check if .env.local exists
echo [INFO] Step 2: Checking environment configuration...
if not exist ".env.local" (
    echo [WARNING] .env.local file not found
    echo [INFO] Creating .env.local template...
    
    echo # MySQL Configuration handled by Docker > .env.local
    echo MYSQL_HOST=mysql >> .env.local
    echo MYSQL_PORT=3306 >> .env.local
    echo MYSQL_USER=certchain_user >> .env.local
    echo MYSQL_PASSWORD=certchain_password >> .env.local
    echo MYSQL_DATABASE=certchain >> .env.local
    echo. >> .env.local
    echo # Blockchain Configuration update after manual contract deployment >> .env.local
    echo NEXT_PUBLIC_CONTRACT_ADDRESS=0x85C553D13BdD2213910043E387072AC412c33653 >> .env.local
    echo NEXT_PUBLIC_CHAIN_ID=1337 >> .env.local
    echo NEXT_PUBLIC_RPC_URL=http://127.0.0.1:7545 >> .env.local
    echo. >> .env.local
    echo # Production settings >> .env.local
    echo NODE_ENV=production >> .env.local
    
    echo [SUCCESS] Created .env.local with default blockchain configuration
    echo [WARNING] Remember to update NEXT_PUBLIC_CONTRACT_ADDRESS after deploying your smart contract
)

echo [SUCCESS] Environment configuration ready
echo.

REM Deploy using Docker Compose
echo [INFO] Step 3: Deploying application with Docker...
echo [INFO] Stopping any existing containers...
docker-compose down --remove-orphans >nul 2>&1
echo [INFO] Building and starting new containers...
docker-compose up -d --build
if errorlevel 1 (
    echo [ERROR] Failed to start Docker containers
    echo [ERROR] Please check if Docker Desktop is running
    pause
    exit /b 1
)

echo [INFO] Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Wait for MySQL to be ready
echo [INFO] Waiting for database to be ready...
for /L %%i in (1,1,30) do (
    docker-compose exec -T mysql mysqladmin ping -h localhost -u root -pmysql --silent >nul 2>&1
    if not errorlevel 1 (
        echo [SUCCESS] Database is ready
        goto :database_ready
    )
    echo [INFO] Still waiting for database... (attempt %%i/30)
    timeout /t 10 /nobreak >nul
)

echo [ERROR] Database failed to start within 5 minutes
echo [ERROR] Docker logs:
docker-compose logs mysql
pause
exit /b 1

:database_ready
echo.

REM Test deployment
echo [INFO] Step 4: Testing deployment...

REM Test web application
echo [INFO] Testing web application...
curl -f http://localhost:3000 >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] Web application is responding
) else (
    echo [ERROR] Web application is not responding
    echo [ERROR] Docker logs:
    docker-compose logs webapp
    pause
    exit /b 1
)

REM Test health endpoint
echo [INFO] Checking system health status...
timeout /t 5 /nobreak >nul

curl -f http://localhost:3000/api/health >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] Health endpoint is working
    echo.
    echo System Health Status:
    curl -s http://localhost:3000/api/health
) else (
    echo [WARNING] Health endpoint is not responding yet
)

echo.
echo DOCKER DEPLOYMENT SUCCESSFUL!
echo.
echo Your application is running:
echo    Web App:         http://localhost:3000
echo    Database Admin:  http://localhost:8080
echo    Health Check:    http://localhost:3000/api/health
echo.
echo Management Commands:
echo    View logs:          docker-compose logs -f
echo    Stop everything:    scripts\deploy.bat --stop
echo    Check health:       scripts\deploy.bat --health
echo.
echo WARNING - Smart Contract Deployment Required:
echo.
echo    Your web application is running, but you need to manually deploy
echo    the smart contract to enable blockchain functionality.
echo.
echo    Manual Smart Contract Deployment Steps:
echo    1. Install Node.js and npm (if not already installed)
echo    2. Install dependencies: npm install
echo    3. Start Ganache GUI app with these settings:
echo       - RPC Server: HTTP://127.0.0.1:7545
echo       - Chain ID: 1337
echo    4. Deploy contract: npx hardhat run scripts/deploy.js --network ganache
echo    5. Update .env.local with the new contract address
echo    6. Restart containers: docker-compose restart webapp
echo.
echo    For detailed instructions, see README.md - 'Manual Smart Contract Deployment' section
echo.
echo Current Status:
echo    ✅ Database and web app running
echo    ⏳ Smart contract deployment pending (manual step required)
echo.
pause 