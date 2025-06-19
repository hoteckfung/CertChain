#!/bin/bash

# 🚀 CertChain Deployment Script (Linux/Mac) v4.0
# Complete setup automation for blockchain certificate system
# Perfect for first-time users who just cloned the repository

set -e  # Exit on any error

echo ""
echo "██████╗███████╗██████╗████████╗ ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗"
echo "██╔════╝██╔════╝██╔══██╚══██╔══╝██╔════╝██║  ██║██╔══██╗██║████╗  ██║"
echo "██║     █████╗  ██████╔╝  ██║   ██║     ███████║███████║██║██╔██╗ ██║"
echo "██║     ██╔══╝  ██╔══██╗  ██║   ██║     ██╔══██║██╔══██║██║██║╚██╗██║"
echo "╚██████╗███████╗██║  ██║  ██║   ╚██████╗██║  ██║██║  ██║██║██║ ╚████║"
echo " ╚═════╝╚══════╝╚═╝  ╚═╝  ╚═╝    ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝"
echo ""
echo "    🏆 Blockchain Certificate Management System v4.0"
echo "    🐧 Linux/Mac Deployment Script - Easy Setup for Everyone!"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_title() {
    echo -e "${PURPLE}[TITLE]${NC} === $1 ==="
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Show comprehensive help
show_help() {
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║                       CERTCHAIN SETUP GUIDE                        ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🎯 QUICK START (for first-time users):"
    echo "   ./scripts/deploy.sh --setup      Interactive guided setup"
    echo "   ./scripts/deploy.sh              Standard deployment"
    echo ""
    echo "🛠️  MANAGEMENT OPTIONS:"
    echo "   --help, -h        Show this comprehensive help"
    echo "   --setup           Interactive guided setup with prerequisites check"
    echo "   --verify          Check all prerequisites without installing"
    echo "   --fresh           Complete fresh start (clean DB + new contract)"
    echo "   --clean           Clean database only (keeps contract)"
    echo "   --health          Check application health status"
    echo "   --logs            Show real-time application logs"
    echo "   --stop            Stop all Docker services"
    echo ""
    echo "📋 WHAT YOU NEED BEFORE STARTING:"
echo "   ✅ Docker and Docker Compose installed and running"
echo "   ✅ Node.js (v16+) for smart contract deployment"
echo "   ✅ Git for cloning the repository"
echo "   ✅ MetaMask browser extension"
echo "   ✅ Ganache GUI for local blockchain"
echo "   ✅ IPFS Desktop for decentralized certificate storage"
    echo ""
    echo "🚀 TYPICAL WORKFLOW FOR NEW USERS:"
    echo "   1. git clone [repository-url]"
    echo "   2. cd CertChain"
    echo "   3. ./scripts/deploy.sh --setup"
    echo "   4. Follow the interactive prompts"
    echo "   5. Connect MetaMask and start using!"
    echo ""
    echo "💡 TROUBLESHOOTING:"
    echo "   • If stuck: ./scripts/deploy.sh --verify"
    echo "   • For logs: ./scripts/deploy.sh --logs"
    echo "   • For help: Visit README.md or GitHub issues"
    echo ""
    read -p "Press Enter to continue..."
}

# Verify prerequisites with detailed output
verify_prerequisites_detailed() {
    print_step "Checking system prerequisites..."
    echo ""
    
    local failed=0
    
    echo "[1/4] 🐳 Checking Docker..."
    if ! command -v docker &> /dev/null; then
        echo "   ❌ Docker is not installed or not in PATH"
        echo "   📥 Install from: https://docs.docker.com/get-docker/"
        echo "   💡 Make sure Docker is running after installation"
        failed=1
    else
        if ! docker --version &> /dev/null; then
            echo "   ❌ Docker command failed"
            echo "   💡 Make sure Docker is running"
            failed=1
        else
            echo "   ✅ Docker is installed and running"
        fi
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "   ❌ Docker Compose is not available"
        echo "   📥 Install from: https://docs.docker.com/compose/install/"
        failed=1
    else
        echo "   ✅ Docker Compose is available"
    fi
    
    echo "[2/4] 📦 Checking Node.js..."
    if ! command -v node &> /dev/null; then
        echo "   ❌ Node.js is not installed"
        echo "   📥 Download from: https://nodejs.org/ (LTS version recommended)"
        failed=1
    else
        echo "   ✅ Node.js is installed ($(node --version))"
    fi
    
    echo "[3/4] 📥 Checking NPM packages..."
    if [ ! -d "node_modules" ]; then
        echo "   📦 Installing Node.js dependencies..."
        if ! npm install; then
            echo "   ❌ Failed to install dependencies"
            echo "   💡 Try: npm cache clean --force && npm install"
            failed=1
        fi
    fi
    echo "   ✅ NPM dependencies are ready"
    
    echo "[4/5] 🦊 Checking MetaMask (optional verification)..."
    echo "   💡 Make sure MetaMask browser extension is installed"
    echo "   📥 Get it from: https://metamask.io/"
    echo "   ✅ MetaMask check reminder completed"
    
    echo "[5/5] 📁 Checking IPFS Desktop..."
    if ! command -v ipfs &> /dev/null; then
        echo "   ⚠️  IPFS command not found (IPFS Desktop may not be installed)"
        echo "   📥 Download from: https://desktop.ipfs.io/"
        echo "   💡 IPFS Desktop is required for certificate storage"
    else
        echo "   ✅ IPFS command is available"
    fi
    
    if ! curl -s http://127.0.0.1:5001/api/v0/id > /dev/null 2>&1; then
        echo "   ❌ IPFS API not responding on port 5001"
        echo "   💡 Make sure IPFS Desktop is running and connected"
        echo "   📥 Download from: https://desktop.ipfs.io/"
        echo "   ⚠️  IMPORTANT: Change IPFS Gateway port to 8081 to avoid conflict with phpMyAdmin"
        echo "       - In IPFS Desktop: Settings → IPFS Config"
        echo "       - Change Gateway port from 8080 to 8081"
        echo "       - Save and restart IPFS Desktop"
    else
        echo "   ✅ IPFS API is responding"
        # Check if gateway is on default port 8080 (conflict with phpMyAdmin)
        if curl -s http://127.0.0.1:8080/ipfs/ > /dev/null 2>&1; then
            echo "   ⚠️  IPFS Gateway running on port 8080 (conflicts with phpMyAdmin)"
            echo "   💡 Please change IPFS Gateway to port 8081:"
            echo "       - In IPFS Desktop: Settings → IPFS Config"
            echo "       - Change Gateway port from 8080 to 8081"
            echo "       - Save and restart IPFS Desktop"
        elif curl -s http://127.0.0.1:8081/ipfs/ > /dev/null 2>&1; then
            echo "   ✅ IPFS Gateway correctly configured on port 8081"
        else
            echo "   ⚠️  IPFS Gateway port unclear, check configuration"
        fi
    fi
    
    return $failed
}

# Check if Docker services are running
check_docker_running() {
    docker-compose ps &> /dev/null
    return $?
}

# Create environment file
create_env_file() {
    print_step "Creating .env.local configuration file..."
    
    cat > .env.local << EOF
# CertChain Environment Configuration
# Generated by deployment script on $(date)

# Database Configuration (auto-managed by Docker)
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=certchain_user
MYSQL_PASSWORD=certchain_password
MYSQL_DATABASE=certchain

# Blockchain Configuration (update after contract deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_CHAIN_ID=1337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:7545

# Deployer Configuration (REQUIRED - get from Ganache GUI)
# Click the key icon next to any account in Ganache
DEPLOYER_PRIVATE_KEY=

# Application Settings
NODE_ENV=production
EOF
    
    echo "   ✅ Created .env.local template"
    echo ""
    echo "🔑 IMPORTANT: You need to add your DEPLOYER_PRIVATE_KEY to .env.local"
    echo "   1. Start Ganache GUI"
    echo "   2. Click the 🔑 icon next to any account"
    echo "   3. Copy the private key"
    echo "   4. Add it to .env.local: DEPLOYER_PRIVATE_KEY=0xYourKeyHere"
    echo ""
}

# Check environment configuration
check_environment() {
    print_step "Checking environment configuration..."
    
    if [ ! -f ".env.local" ]; then
        echo "   ⚠️  No .env.local found, creating template..."
        create_env_file
    else
        echo "   ✅ Environment file exists"
    fi
    
    # Check for critical missing values
    if ! grep -q "DEPLOYER_PRIVATE_KEY=0x" .env.local; then
        echo "   ⚠️  DEPLOYER_PRIVATE_KEY not set in .env.local"
        echo "   💡 You'll need this for smart contract deployment"
    fi
}

# Check Ganache with detailed instructions
check_ganache_with_instructions() {
    print_step "Checking Ganache connection..."
    
    if ! curl -s http://127.0.0.1:7545 > /dev/null 2>&1; then
        echo "   ❌ Cannot connect to Ganache on port 7545"
        echo ""
        echo "   📥 Please download and start Ganache GUI:"
        echo "      1. Visit: https://trufflesuite.com/ganache/"
        echo "      2. Download and install Ganache GUI"
        echo "      3. Click \"QUICKSTART\" (easiest option)"
        echo "      4. Verify settings:"
        echo "         - RPC Server: HTTP://127.0.0.1:7545"
        echo "         - Chain ID: 1337"
        echo ""
        echo "   💡 Once Ganache is running, try this command again"
        return 1
    fi
    
    echo "   ✅ Ganache is running and accessible"
    return 0
}

# Check IPFS with detailed instructions
check_ipfs_with_instructions() {
    print_step "Checking IPFS Desktop connection..."
    
    if ! curl -s http://127.0.0.1:5001/api/v0/id > /dev/null 2>&1; then
        echo "   ❌ Cannot connect to IPFS API on port 5001"
        echo ""
        echo "   📁 Please download and start IPFS Desktop:"
        echo "      1. Visit: https://desktop.ipfs.io/"
        echo "      2. Download and install IPFS Desktop"
        echo "      3. Start the application (you'll see green \"Connected\" status)"
        echo "      4. IMPORTANT: Resolve port conflict with phpMyAdmin:"
        echo "         - Go to Settings → IPFS Config"
        echo "         - Find 'Addresses' section"
        echo "         - Change Gateway from '/ip4/127.0.0.1/tcp/8080' to '/ip4/127.0.0.1/tcp/8081'"
        echo "         - Save and restart IPFS Desktop"
        echo ""
        echo "   💡 Once IPFS Desktop is running and configured, try this command again"
        return 1
    fi
    
    echo "   ✅ IPFS API is running and accessible"
    
    # Check gateway port configuration
    if curl -s http://127.0.0.1:8080/ipfs/ > /dev/null 2>&1; then
        echo "   ⚠️  IPFS Gateway on port 8080 conflicts with phpMyAdmin"
        echo "   💡 Please change to port 8081 in IPFS Desktop settings"
        return 1
    elif curl -s http://127.0.0.1:8081/ipfs/ > /dev/null 2>&1; then
        echo "   ✅ IPFS Gateway correctly configured on port 8081"
    else
        echo "   ⚠️  IPFS Gateway not responding - check configuration"
    fi
    
    return 0
}

# Start Docker services
start_docker_services() {
    print_step "Starting Docker services..."
    
    echo "   🛑 Stopping any existing containers..."
    docker-compose down --remove-orphans > /dev/null 2>&1
    
    echo "   🔨 Building and starting containers..."
    if ! docker-compose up -d --build; then
        echo "   ❌ Failed to start Docker services"
        echo "   💡 Make sure Docker is running"
        echo "   💡 Try: docker-compose logs for more details"
        return 1
    fi
    
    echo "   ✅ Docker services started successfully"
    return 0
}

# Wait for services to be ready
wait_for_services() {
    print_step "Waiting for services to initialize..."
    sleep 10
    
    print_step "Waiting for database to be ready..."
    for i in {1..30}; do
        if docker-compose exec -T mysql mysqladmin ping -h localhost -u root -pmysql --silent > /dev/null 2>&1; then
            echo "   ✅ Database is ready"
            return 0
        fi
        if [ $i -eq 30 ]; then
            echo "   ❌ Database failed to start within 5 minutes"
            echo "   💡 Check logs: docker-compose logs mysql"
            return 1
        fi
        echo "   ⏳ Database starting... (attempt $i/30)"
        sleep 10
    done
}

# Test deployment
test_deployment() {
    print_step "Testing deployment..."
    
    echo "   🌐 Testing web application..."
    if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "   ❌ Web application not responding"
        echo "   💡 Check logs: docker-compose logs webapp"
        return 1
    fi
    echo "   ✅ Web application is running"
    
    echo "   🏥 Testing health endpoint..."
    sleep 5
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "   ✅ Health endpoint is working"
        echo ""
        echo "📊 Current System Status:"
        curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/health
        echo ""
    else
        echo "   ⚠️  Health endpoint not responding yet (this is normal)"
    fi
    
    return 0
}

# Deploy smart contract for fresh start
deploy_smart_contract_fresh() {
    print_step "Deploying smart contract..."
    
    # Check if DEPLOYER_PRIVATE_KEY is set
    if ! grep -q "DEPLOYER_PRIVATE_KEY=0x" .env.local; then
        echo "   ❌ DEPLOYER_PRIVATE_KEY not set in .env.local"
        echo "   💡 Please add your Ganache private key and try again"
        return 1
    fi
    
    echo "   🔨 Compiling contracts..."
    if ! npx hardhat compile; then
        echo "   ❌ Contract compilation failed"
        return 1
    fi
    
    echo "   📤 Deploying to Ganache..."
    if ! npx hardhat run scripts/deploy.js --network ganache; then
        echo "   ❌ Contract deployment failed"
        echo "   💡 Check that Ganache is running and DEPLOYER_PRIVATE_KEY is correct"
        return 1
    fi
    
    echo "   ✅ Smart contract deployed successfully"
    return 0
}

# Fresh deployment process
fresh_deployment() {
    echo ""
    print_step "Step 1: Prerequisites check..."
    if ! verify_prerequisites_detailed; then
        return 1
    fi
    
    echo ""
    print_step "Step 2: Starting Docker services..."
    if ! start_docker_services; then
        return 1
    fi
    
    if ! wait_for_services; then
        return 1
    fi
    
    echo ""
    print_step "Step 3: Cleaning database..."
    if ! node scripts/clean-database.js; then
        print_error "Database clean failed"
        return 1
    fi
    
    echo ""
    print_step "Step 4: Checking Ganache..."
    if ! check_ganache_with_instructions; then
        return 1
    fi
    
    echo ""
    print_step "Step 4.5: Checking IPFS Desktop..."
    if ! check_ipfs_with_instructions; then
        print_warning "IPFS Desktop not properly configured"
        echo "   💡 CertChain will work, but certificate uploads may fail"
        echo "   💡 Please set up IPFS Desktop before issuing certificates"
    fi
    
    echo ""
    print_step "Step 5: Deploying smart contract..."
    if ! deploy_smart_contract_fresh; then
        return 1
    fi
    
    echo ""
    print_step "Step 6: Restarting services with new config..."
    docker-compose restart webapp
    echo "   ✅ Services restarted"
    
    return 0
}

# Clean database only
clean_database() {
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║                        DATABASE CLEANUP                            ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "⚠️  WARNING: This will remove ALL data from the database!"
    echo "   • All users will be deleted"
    echo "   • All certificates will be deleted"
    echo "   • All activity logs will be deleted"
    echo "   • All sessions will be cleared"
    echo ""
    read -p "Are you sure you want to proceed? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        print_status "Database cleanup cancelled"
        return 0
    fi
    
    if ! check_docker_running; then
        print_step "Starting Docker services for database access..."
        if ! start_docker_services || ! wait_for_services; then
            return 1
        fi
    fi
    
    echo ""
    print_step "Cleaning database..."
    if ! node scripts/clean-database.js; then
        print_error "Database cleanup failed"
        return 1
    fi
    
    echo ""
    print_success "Database cleaned successfully!"
    echo "💡 Visit http://localhost:3000/clear-storage.html to clear browser cache"
    echo ""
}

# Fresh start with confirmation
fresh_start() {
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║                         FRESH START MODE                           ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🔄 This will perform a COMPLETE fresh start:"
    echo "   1. ✅ Clean ALL database data"
    echo "   2. ✅ Deploy NEW smart contract"
    echo "   3. ✅ Update configuration automatically"
    echo "   4. ✅ Restart all services"
    echo ""
    echo "⚠️  Make sure you have:"
    echo "   • Ganache GUI running on port 7545"
    echo "   • DEPLOYER_PRIVATE_KEY set in .env.local"
    echo ""
    
    read -p "Continue with complete fresh start? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        print_status "Fresh start cancelled"
        return 0
    fi
    
    echo ""
    print_status "Starting fresh deployment process..."
    if fresh_deployment; then
        deployment_complete
    else
        print_error "Fresh deployment failed"
        return 1
    fi
}

# Guided setup
guided_setup() {
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║                    INTERACTIVE GUIDED SETUP                        ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🎯 This will guide you through setting up CertChain step by step!"
    echo ""
    
    if ! verify_prerequisites_detailed; then
        echo ""
        print_error "Prerequisites check failed. Please install missing components and try again."
        echo "💡 Run './scripts/deploy.sh --verify' to check prerequisites only."
        return 1
    fi
    
    echo ""
    print_success "All prerequisites verified! Continuing with setup..."
    echo ""
    
    # Check if .env.local exists
    if [ -f ".env.local" ]; then
        echo "📄 Found existing .env.local configuration."
        read -p "Do you want to recreate it? (y/N): " overwrite
        if [[ "$overwrite" =~ ^[Yy]$ ]]; then
            create_env_file
        fi
    else
        echo "📄 Creating environment configuration..."
        create_env_file
    fi
    
    echo ""
    print_step "Starting Docker services..."
    if ! start_docker_services || ! wait_for_services; then
        return 1
    fi
    
    echo ""
    print_step "Checking Ganache status..."
    check_ganache_with_instructions
    
    echo ""
    print_step "Checking IPFS Desktop status..."
    check_ipfs_with_instructions
    
    echo ""
    print_success "Basic setup complete!"
    echo ""
    echo "📋 NEXT STEPS:"
echo "   1. 📁 Set up IPFS Desktop for certificate storage"
echo "   2. 🔑 Set your DEPLOYER_PRIVATE_KEY in .env.local (from Ganache)"
echo "   3. 🚀 Deploy smart contract: npx hardhat run scripts/deploy.js --network ganache"
echo "   4. 🔄 Update config: node scripts/update-contract-address.js [CONTRACT_ADDRESS]"
echo "   5. 🌐 Visit: http://localhost:3000"
    echo ""
    echo "💡 TIP: Use './scripts/deploy.sh --fresh' for complete automated deployment"
    echo "     or continue manually with the steps above."
    echo ""
    read -p "Press Enter to continue..."
}

# Standard deployment
standard_deployment() {
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║                       STANDARD DEPLOYMENT                          ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
    echo ""
    print_step "Setting up CertChain with existing configuration..."
    echo ""
    
    if ! verify_prerequisites_detailed; then
        echo ""
        echo "💡 TIP: Run './scripts/deploy.sh --setup' for interactive guided setup"
        return 1
    fi
    
    check_environment
    
    if ! start_docker_services || ! wait_for_services; then
        return 1
    fi
    
    test_deployment
    deployment_complete
}

# Show deployment completion info
deployment_complete() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║                     🎉 DEPLOYMENT SUCCESSFUL! 🎉                   ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🌐 YOUR CERTCHAIN SYSTEM IS NOW RUNNING:"
echo "   💻 Web Application:     http://localhost:3000"
echo "   🗄️  Database Admin:      http://localhost:8080"
echo "   📁 IPFS Gateway:        http://localhost:8081 (if configured)"
echo "   🏥 Health Check:        http://localhost:3000/api/health"
echo "   🧹 Storage Cleaner:     http://localhost:3000/clear-storage.html"
    echo ""
    echo "🛠️  MANAGEMENT COMMANDS:"
    echo "   📊 View logs:           ./scripts/deploy.sh --logs"
    echo "   🛑 Stop services:       ./scripts/deploy.sh --stop"
    echo "   🏥 Check health:        ./scripts/deploy.sh --health"
    echo "   🧹 Clean database:      ./scripts/deploy.sh --clean"
    echo "   🔄 Fresh restart:       ./scripts/deploy.sh --fresh"
    echo ""
    echo "🚀 QUICK START GUIDE:"
    echo "   1. 🦊 Open MetaMask and add Ganache network:"
    echo "      • Network Name: Ganache Local"
    echo "      • RPC URL: http://127.0.0.1:7545"
    echo "      • Chain ID: 1337"
    echo "      • Currency: ETH"
    echo ""
    echo "   2. 🔑 Import your Ganache account to MetaMask:"
    echo "      • In Ganache: Click 🔑 next to any account"
    echo "      • In MetaMask: Import Account → Paste private key"
    echo ""
    echo "   3. 🌐 Visit your application:"
    echo "      • Go to http://localhost:3000"
    echo "      • Connect your MetaMask wallet"
    echo "      • Start issuing certificates!"
    echo ""
    echo "💡 TROUBLESHOOTING:"
echo "   • No certificates showing? Clear browser storage at /clear-storage.html"
echo "   • Contract errors? Check Ganache is running and wallet is connected"
echo "   • Database issues? Try ./scripts/deploy.sh --clean"
echo "   • Certificate upload failures? Check IPFS Desktop is running on port 5001"
echo "   • Port conflicts? Make sure IPFS Gateway uses port 8081 (not 8080)"
    echo ""
    echo "📚 For detailed documentation, check the README.md file"
    echo ""
    read -p "Press Enter to continue..."
}

# Stop all services
stop_all_services() {
    print_step "Stopping all services..."
    docker-compose down
    print_success "All services stopped"
    print_status "Note: This does not stop Ganache GUI if running separately"
}

# Verify prerequisites only
verify_prerequisites_only() {
    if verify_prerequisites_detailed; then
        echo ""
        print_success "All prerequisites are properly installed!"
        echo "🚀 You're ready to deploy CertChain."
        echo ""
    else
        return 1
    fi
}

# Health check
health_check() {
    print_step "Checking CertChain application health..."
    echo ""
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Application is healthy and responding!"
        echo ""
        echo "📊 Current System Status:"
        curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/health
    else
        print_error "Application is not responding. Is it running?"
        echo "💡 Try: ./scripts/deploy.sh"
    fi
    echo ""
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    --setup)
        guided_setup
        exit $?
        ;;
    --verify)
        verify_prerequisites_only
        exit $?
        ;;
    --logs)
        echo "📊 Showing real-time application logs..."
        echo "💡 Press Ctrl+C to stop viewing logs"
        echo ""
        docker-compose logs -f
        exit 0
        ;;
    --health)
        health_check
        exit 0
        ;;
    --stop)
        stop_all_services
        exit 0
        ;;
    --clean)
        clean_database
        exit $?
        ;;
    --fresh)
        fresh_start
        exit $?
        ;;
    *)
        standard_deployment
        exit $?
        ;;
esac 