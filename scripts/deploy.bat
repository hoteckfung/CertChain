@echo off
REM 🚀 CertChain Deployment Script (Windows) v4.0
REM Complete setup automation for blockchain certificate system
REM Perfect for first-time users who just cloned the repository

setlocal enabledelayedexpansion

echo.
echo ██████╗███████╗██████╗████████╗ ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗
echo██╔════╝██╔════╝██╔══██╚══██╔══╝██╔════╝██║  ██║██╔══██╗██║████╗  ██║
echo██║     █████╗  ██████╔╝  ██║   ██║     ███████║███████║██║██╔██╗ ██║
echo██║     ██╔══╝  ██╔══██╗  ██║   ██║     ██╔══██║██╔══██║██║██║╚██╗██║
echo╚██████╗███████╗██║  ██║  ██║   ╚██████╗██║  ██║██║  ██║██║██║ ╚████║
echo ╚═════╝╚══════╝╚═╝  ╚═╝  ╚═╝    ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
echo.
echo    🏆 Blockchain Certificate Management System v4.0
echo    💻 Windows Deployment Script - Easy Setup for Everyone!
echo.

REM Handle command line arguments
if "%1"=="--help" goto help
if "%1"=="-h" goto help
if "%1"=="--setup" goto guided_setup
if "%1"=="--health" goto health_check
if "%1"=="--logs" goto show_logs
if "%1"=="--stop" goto stop_services
if "%1"=="--clean" goto clean_database
if "%1"=="--fresh" goto fresh_start
if "%1"=="--verify" goto verify_prerequisites
goto main_deployment

:help
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                       CERTCHAIN SETUP GUIDE                        ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
echo 🎯 QUICK START (for first-time users):
echo    scripts\deploy.bat --setup      Interactive guided setup
echo    scripts\deploy.bat              Standard deployment
echo.
echo 🛠️  MANAGEMENT OPTIONS:
echo    --help, -h        Show this comprehensive help
echo    --setup           Interactive guided setup with prerequisites check
echo    --verify          Check all prerequisites without installing
echo    --fresh           Complete fresh start (clean DB + new contract)
echo    --clean           Clean database only (keeps contract)
echo    --health          Check application health status
echo    --logs            Show real-time application logs
echo    --stop            Stop all Docker services
echo.
echo 📋 WHAT YOU NEED BEFORE STARTING:
echo    ✅ Docker Desktop installed and running
echo    ✅ Node.js (v16+) for smart contract deployment
echo    ✅ Git for cloning the repository
echo    ✅ MetaMask browser extension
echo    ✅ Ganache GUI for local blockchain
echo.
echo 🚀 TYPICAL WORKFLOW FOR NEW USERS:
echo    1. git clone [repository-url]
echo    2. cd CertChain
echo    3. scripts\deploy.bat --setup
echo    4. Follow the interactive prompts
echo    5. Connect MetaMask and start using!
echo.
echo 💡 TROUBLESHOOTING:
echo    • If stuck: scripts\deploy.bat --verify
echo    • For logs: scripts\deploy.bat --logs  
echo    • For help: Visit README.md or GitHub issues
echo.
pause
exit /b 0

:guided_setup
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                    INTERACTIVE GUIDED SETUP                        ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
echo 🎯 This will guide you through setting up CertChain step by step!
echo.

call :verify_prerequisites_detailed
if errorlevel 1 (
    echo.
    echo ❌ Prerequisites check failed. Please install missing components and try again.
    echo 💡 Run 'scripts\deploy.bat --verify' to check prerequisites only.
    pause
    exit /b 1
)

echo.
echo ✅ All prerequisites verified! Continuing with setup...
echo.

REM Check if .env.local exists
if exist ".env.local" (
    echo 📄 Found existing .env.local configuration.
    set /p overwrite="Do you want to recreate it? (y/N): "
    if /i "!overwrite!"=="y" (
        call :create_env_file
    )
) else (
    echo 📄 Creating environment configuration...
    call :create_env_file
)

echo.
echo 🐳 Starting Docker services...
call :start_docker_services
if errorlevel 1 exit /b 1

echo.
echo 🔍 Checking Ganache status...
call :check_ganache_with_instructions
if errorlevel 1 exit /b 1

echo.
echo 🎉 Basic setup complete! 
echo.
echo 📋 NEXT STEPS:
echo    1. 🔑 Set your DEPLOYER_PRIVATE_KEY in .env.local (from Ganache)
echo    2. 🚀 Deploy smart contract: npx hardhat run scripts/deploy.js --network ganache
echo    3. 🔄 Update config: node scripts/update-contract-address.js [CONTRACT_ADDRESS]
echo    4. 🌐 Visit: http://localhost:3000
echo.
echo 💡 TIP: Use 'scripts\deploy.bat --fresh' for complete automated deployment
echo      or continue manually with the steps above.
echo.
pause
exit /b 0

:verify_prerequisites
call :verify_prerequisites_detailed
if errorlevel 1 exit /b 1
echo.
echo ✅ All prerequisites are properly installed!
echo 🚀 You're ready to deploy CertChain.
echo.
pause
exit /b 0

:health_check
echo 🔍 Checking CertChain application health...
echo.
curl -s http://localhost:3000/api/health 2>nul
if errorlevel 1 (
    echo ❌ Application is not responding. Is it running?
    echo 💡 Try: scripts\deploy.bat
) else (
    echo ✅ Application is healthy and responding!
)
echo.
pause
exit /b 0

:show_logs
echo 📊 Showing real-time application logs...
echo 💡 Press Ctrl+C to stop viewing logs
echo.
docker-compose logs -f
exit /b 0

:stop_services
echo 🛑 Stopping all CertChain services...
docker-compose down
echo ✅ All services stopped successfully
echo 💡 Note: This doesn't stop Ganache GUI if running separately
echo.
pause
exit /b 0

:clean_database
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                        DATABASE CLEANUP                            ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
echo ⚠️  WARNING: This will remove ALL data from the database!
echo    • All users will be deleted
echo    • All certificates will be deleted  
echo    • All activity logs will be deleted
echo    • All sessions will be cleared
echo.
set /p confirm="Are you sure you want to proceed? (y/N): "
if /i not "%confirm%"=="y" (
    echo ❌ Database cleanup cancelled
    pause
    exit /b 0
)

call :check_docker_running
if errorlevel 1 (
    echo 🐳 Starting Docker services for database access...
    call :start_docker_services
    if errorlevel 1 exit /b 1
)

echo.
echo 🧹 Cleaning database...
node scripts/clean-database.js
if errorlevel 1 (
    echo ❌ Database cleanup failed
    pause
    exit /b 1
)

echo.
echo ✅ Database cleaned successfully!
echo 💡 Visit http://localhost:3000/clear-storage.html to clear browser cache
echo.
pause
exit /b 0

:fresh_start
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                         FRESH START MODE                           ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
echo 🔄 This will perform a COMPLETE fresh start:
echo    1. ✅ Clean ALL database data
echo    2. ✅ Deploy NEW smart contract  
echo    3. ✅ Update configuration automatically
echo    4. ✅ Restart all services
echo.
echo ⚠️  Make sure you have:
echo    • Ganache GUI running on port 7545
echo    • DEPLOYER_PRIVATE_KEY set in .env.local
echo.

set /p confirm="Continue with complete fresh start? (y/N): "
if /i not "%confirm%"=="y" (
    echo ❌ Fresh start cancelled
    pause
    exit /b 0
)

echo.
echo 🚀 Starting fresh deployment process...
call :fresh_deployment
exit /b 0

:main_deployment
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                       STANDARD DEPLOYMENT                          ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
echo 🏗️  Setting up CertChain with existing configuration...
echo.

call :verify_prerequisites_detailed
if errorlevel 1 (
    echo.
    echo 💡 TIP: Run 'scripts\deploy.bat --setup' for interactive guided setup
    pause
    exit /b 1
)

call :check_environment
call :start_docker_services
if errorlevel 1 exit /b 1

call :wait_for_services
call :test_deployment

goto deployment_complete

REM ============================================================================
REM                              HELPER FUNCTIONS
REM ============================================================================

:verify_prerequisites_detailed
echo 🔍 Checking system prerequisites...
echo.

echo [1/4] 🐳 Checking Docker Desktop...
docker --version >nul 2>&1
if errorlevel 1 (
    echo    ❌ Docker is not installed or not in PATH
    echo    📥 Download from: https://docs.docker.com/desktop/windows/
    echo    💡 Make sure Docker Desktop is running after installation
    exit /b 1
)
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo    ❌ Docker Compose is not available
    echo    💡 This usually comes with Docker Desktop
    exit /b 1
)
echo    ✅ Docker Desktop is installed

echo [2/4] 📦 Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo    ❌ Node.js is not installed
    echo    📥 Download from: https://nodejs.org/ (LTS version recommended)
    exit /b 1
)
echo    ✅ Node.js is installed

echo [3/4] 📥 Checking NPM packages...
if not exist "node_modules" (
    echo    📦 Installing Node.js dependencies...
    npm install
    if errorlevel 1 (
        echo    ❌ Failed to install dependencies
        echo    💡 Try: npm cache clean --force && npm install
        exit /b 1
    )
)
echo    ✅ NPM dependencies are ready

echo [4/4] 🦊 Checking MetaMask (optional verification)...
echo    💡 Make sure MetaMask browser extension is installed
echo    📥 Get it from: https://metamask.io/
echo    ✅ MetaMask check reminder completed

exit /b 0

:check_docker_running
docker-compose ps >nul 2>&1
exit /b %errorlevel%

:create_env_file
echo 📝 Creating .env.local configuration file...

echo # CertChain Environment Configuration > .env.local
echo # Generated by deployment script on %date% %time% >> .env.local
echo. >> .env.local
echo # Database Configuration (auto-managed by Docker) >> .env.local
echo MYSQL_HOST=mysql >> .env.local
echo MYSQL_PORT=3306 >> .env.local
echo MYSQL_USER=certchain_user >> .env.local
echo MYSQL_PASSWORD=certchain_password >> .env.local
echo MYSQL_DATABASE=certchain >> .env.local
echo. >> .env.local
echo # Blockchain Configuration (update after contract deployment) >> .env.local
echo NEXT_PUBLIC_CONTRACT_ADDRESS= >> .env.local
echo NEXT_PUBLIC_CHAIN_ID=1337 >> .env.local
echo NEXT_PUBLIC_RPC_URL=http://127.0.0.1:7545 >> .env.local
echo. >> .env.local
echo # Deployer Configuration (REQUIRED - get from Ganache GUI) >> .env.local
echo # Click the key icon next to any account in Ganache >> .env.local
echo DEPLOYER_PRIVATE_KEY= >> .env.local
echo. >> .env.local
echo # Application Settings >> .env.local
echo NODE_ENV=production >> .env.local

echo    ✅ Created .env.local template
echo.
echo 🔑 IMPORTANT: You need to add your DEPLOYER_PRIVATE_KEY to .env.local
echo    1. Start Ganache GUI
echo    2. Click the 🔑 icon next to any account  
echo    3. Copy the private key
echo    4. Add it to .env.local: DEPLOYER_PRIVATE_KEY=0xYourKeyHere
echo.
exit /b 0

:check_environment
echo 🔧 Checking environment configuration...

if not exist ".env.local" (
    echo    ⚠️  No .env.local found, creating template...
    call :create_env_file
) else (
    echo    ✅ Environment file exists
)

REM Check for critical missing values
findstr /C:"DEPLOYER_PRIVATE_KEY=" .env.local | findstr /V /C:"DEPLOYER_PRIVATE_KEY=$" | findstr /V /C:"DEPLOYER_PRIVATE_KEY= " >nul
if errorlevel 1 (
    echo    ⚠️  DEPLOYER_PRIVATE_KEY not set in .env.local
    echo    💡 You'll need this for smart contract deployment
)

exit /b 0

:check_ganache_with_instructions
echo 🔍 Checking Ganache connection...
curl -s http://127.0.0.1:7545 >nul 2>&1
if errorlevel 1 (
    echo    ❌ Cannot connect to Ganache on port 7545
    echo.
    echo    📥 Please download and start Ganache GUI:
    echo       1. Visit: https://trufflesuite.com/ganache/
    echo       2. Download and install Ganache GUI
    echo       3. Click "QUICKSTART" (easiest option)
    echo       4. Verify settings:
    echo          - RPC Server: HTTP://127.0.0.1:7545  
    echo          - Chain ID: 1337
    echo    
    echo    💡 Once Ganache is running, try this command again
    exit /b 1
)
echo    ✅ Ganache is running and accessible
exit /b 0

:start_docker_services
echo 🐳 Starting Docker services...
echo    🛑 Stopping any existing containers...
docker-compose down --remove-orphans >nul 2>&1

echo    🔨 Building and starting containers...
docker-compose up -d --build
if errorlevel 1 (
    echo    ❌ Failed to start Docker services
    echo    💡 Make sure Docker Desktop is running
    echo    💡 Try: docker-compose logs for more details
    exit /b 1
)

echo    ✅ Docker services started successfully
exit /b 0

:wait_for_services
echo ⏳ Waiting for services to initialize...
timeout /t 10 /nobreak >nul

echo 🔍 Waiting for database to be ready...
for /L %%i in (1,1,30) do (
    docker-compose exec -T mysql mysqladmin ping -h localhost -u root -pmysql --silent >nul 2>&1
    if not errorlevel 1 (
        echo    ✅ Database is ready
        goto mysql_ready
    )
    if %%i==30 (
        echo    ❌ Database failed to start within 5 minutes
        echo    💡 Check logs: docker-compose logs mysql
        exit /b 1
    )
    echo    ⏳ Database starting... (attempt %%i/30)
    timeout /t 10 /nobreak >nul
)

:mysql_ready
exit /b 0

:test_deployment
echo 🧪 Testing deployment...

echo    🌐 Testing web application...
curl -f http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo    ❌ Web application not responding
    echo    💡 Check logs: docker-compose logs webapp
    exit /b 1
)
echo    ✅ Web application is running

echo    🏥 Testing health endpoint...
timeout /t 5 /nobreak >nul
curl -f http://localhost:3000/api/health >nul 2>&1
if not errorlevel 1 (
    echo    ✅ Health endpoint is working
    echo.
    echo 📊 Current System Status:
    curl -s http://localhost:3000/api/health
    echo.
) else (
    echo    ⚠️  Health endpoint not responding yet (this is normal)
)
exit /b 0

:fresh_deployment
echo.
echo 🔄 Step 1: Prerequisites check...
call :verify_prerequisites_detailed
if errorlevel 1 exit /b 1

echo.
echo 🔄 Step 2: Starting Docker services...
call :start_docker_services
if errorlevel 1 exit /b 1

call :wait_for_services

echo.
echo 🔄 Step 3: Cleaning database...
node scripts/clean-database.js
if errorlevel 1 (
    echo ❌ Database clean failed
    exit /b 1
)

echo.
echo 🔄 Step 4: Checking Ganache...
call :check_ganache_with_instructions
if errorlevel 1 exit /b 1

echo.
echo 🔄 Step 5: Deploying smart contract...
call :deploy_smart_contract_fresh
if errorlevel 1 exit /b 1

echo.
echo 🔄 Step 6: Restarting services with new config...
docker-compose restart webapp
echo    ✅ Services restarted

goto deployment_complete

:deploy_smart_contract_fresh
echo 🚀 Deploying smart contract...

REM Check if DEPLOYER_PRIVATE_KEY is set
findstr /C:"DEPLOYER_PRIVATE_KEY=" .env.local | findstr /V /C:"DEPLOYER_PRIVATE_KEY=$" | findstr /V /C:"DEPLOYER_PRIVATE_KEY= " >nul
if errorlevel 1 (
    echo    ❌ DEPLOYER_PRIVATE_KEY not set in .env.local
    echo    💡 Please add your Ganache private key and try again
    exit /b 1
)

echo    🔨 Compiling contracts...
npx hardhat compile
if errorlevel 1 (
    echo    ❌ Contract compilation failed
    exit /b 1
)

echo    📤 Deploying to Ganache...
npx hardhat run scripts/deploy.js --network ganache
if errorlevel 1 (
    echo    ❌ Contract deployment failed
    echo    💡 Check that Ganache is running and DEPLOYER_PRIVATE_KEY is correct
    exit /b 1
)

echo    ✅ Smart contract deployed successfully
exit /b 0

:deployment_complete
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                     🎉 DEPLOYMENT SUCCESSFUL! 🎉                   ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
echo 🌐 YOUR CERTCHAIN SYSTEM IS NOW RUNNING:
echo    💻 Web Application:     http://localhost:3000
echo    🗄️  Database Admin:      http://localhost:8080
echo    🏥 Health Check:        http://localhost:3000/api/health
echo    🧹 Storage Cleaner:     http://localhost:3000/clear-storage.html
echo.
echo 🛠️  MANAGEMENT COMMANDS:
echo    📊 View logs:           scripts\deploy.bat --logs
echo    🛑 Stop services:       scripts\deploy.bat --stop  
echo    🏥 Check health:        scripts\deploy.bat --health
echo    🧹 Clean database:      scripts\deploy.bat --clean
echo    🔄 Fresh restart:       scripts\deploy.bat --fresh
echo.
echo 🚀 QUICK START GUIDE:
echo    1. 🦊 Open MetaMask and add Ganache network:
echo       • Network Name: Ganache Local
echo       • RPC URL: http://127.0.0.1:7545  
echo       • Chain ID: 1337
echo       • Currency: ETH
echo.
echo    2. 🔑 Import your Ganache account to MetaMask:
echo       • In Ganache: Click 🔑 next to any account
echo       • In MetaMask: Import Account → Paste private key
echo.
echo    3. 🌐 Visit your application:
echo       • Go to http://localhost:3000
echo       • Connect your MetaMask wallet
echo       • Start issuing certificates!
echo.
echo 💡 TROUBLESHOOTING:
echo    • No certificates showing? Clear browser storage at /clear-storage.html
echo    • Contract errors? Check Ganache is running and wallet is connected
echo    • Database issues? Try scripts\deploy.bat --clean
echo.
echo 📚 For detailed documentation, check the README.md file
echo.
pause 