#!/bin/bash

# 🚀 CertChain Deployment Script
# This script automates the deployment of your blockchain certificate system
# Smart contracts must be deployed manually (see README.md for instructions)

set -e  # Exit on any error

echo "🚀 Starting CertChain Deployment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if .env.local exists
check_environment() {
    if [ ! -f ".env.local" ]; then
        print_warning ".env.local file not found"
        print_status "Creating .env.local template..."
        
        cat > .env.local << EOF
# MySQL Configuration (handled by Docker)
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=certchain_user
MYSQL_PASSWORD=certchain_password
MYSQL_DATABASE=certchain

# Blockchain Configuration (update after manual contract deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x85C553D13BdD2213910043E387072AC412c33653
NEXT_PUBLIC_CHAIN_ID=1337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:7545

# Production settings
NODE_ENV=production
EOF
        
        print_success "Created .env.local with default blockchain configuration"
        print_warning "Remember to update NEXT_PUBLIC_CONTRACT_ADDRESS after deploying your smart contract"
    fi
    
    print_success "Environment configuration ready"
}

# Deploy using Docker Compose
deploy_with_docker() {
    print_status "Deploying application with Docker..."
    
    # Build and start containers
    docker-compose down --remove-orphans > /dev/null 2>&1
    docker-compose up -d --build
    
    print_status "Waiting for services to start..."
    sleep 10
    
    # Wait for MySQL to be ready
    print_status "Waiting for database to be ready..."
    for i in {1..30}; do
        if docker-compose exec -T mysql mysqladmin ping -h localhost -u root -pmysql --silent; then
            print_success "Database is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Database failed to start within 5 minutes"
            docker-compose logs mysql
            exit 1
        fi
        sleep 10
    done
}

# Test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Test web application
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Web application is responding"
    else
        print_error "Web application is not responding"
        docker-compose logs webapp
        exit 1
    fi
    
    # Test health endpoint
    print_status "Checking system health status..."
    sleep 5  # Give the app time to fully start
    
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Health endpoint is working"
        echo ""
        echo "🎯 System Health Status:"
        curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/health
    else
        print_warning "Health endpoint is not responding yet"
    fi
}

# Show deployment info
show_deployment_info() {
    echo ""
    echo "🎉 DOCKER DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "📍 Your application is running:"
    echo "   🌐 Web App:         http://localhost:3000"
    echo "   📊 Database Admin:  http://localhost:8080"
    echo "   🔍 Health Check:    http://localhost:3000/api/health"
    echo ""
    echo "📋 Management Commands:"
    echo "   View logs:          docker-compose logs -f"
    echo "   Stop everything:    ./scripts/deploy.sh --stop"
    echo "   Check health:       ./scripts/deploy.sh --health"
    echo ""
    echo "⚠️  IMPORTANT - Smart Contract Deployment Required:"
    echo ""
    echo "   Your web application is running, but you need to manually deploy"
    echo "   the smart contract to enable blockchain functionality."
    echo ""
    echo "   📋 Manual Smart Contract Deployment Steps:"
    echo "   1. Install Node.js and npm (if not already installed)"
    echo "   2. Install dependencies: npm install"
    echo "   3. Install Ganache globally: npm install -g ganache"
    echo "   4. Start Ganache: ganache --host 0.0.0.0 --port 7545 --chainId 1337"
    echo "   5. Deploy contract: npx hardhat run scripts/deploy.js --network ganache"
    echo "   6. Update .env.local with the new contract address"
    echo "   7. Restart containers: docker-compose restart webapp"
    echo ""
    echo "   📖 For detailed instructions, see README.md - 'Manual Smart Contract Deployment' section"
    echo ""
    echo "🔧 Current Status:"
    echo "   ✅ Database and web app running"
    echo "   ⏳ Smart contract deployment pending (manual step required)"
    echo ""
}

# Stop all services
stop_all_services() {
    print_status "Stopping all services..."
    docker-compose down
    print_success "All services stopped"
    print_status "Note: This does not stop Ganache if running separately"
}

# Main deployment flow
main() {
    echo "🏗️  CertChain Blockchain Certificate System"
    echo "   Docker Deployment Script v2.1"
    echo ""
    
    print_status "Step 1: Checking prerequisites..."
    check_docker
    
    print_status "Step 2: Checking environment configuration..."
    check_environment
    
    print_status "Step 3: Deploying application with Docker..."
    deploy_with_docker
    
    print_status "Step 4: Testing deployment..."
    test_deployment
    
    show_deployment_info
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "CertChain Docker Deployment Script"
        echo ""
        echo "Usage: ./scripts/deploy.sh [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --logs         Show application logs"
        echo "  --health       Check application health"
        echo "  --stop         Stop all Docker services"
        echo ""
        echo "Note: Smart contracts must be deployed manually"
        echo "See README.md for complete deployment instructions"
        exit 0
        ;;
    --logs)
        docker-compose logs -f
        exit 0
        ;;
    --health)
        echo "🔍 Checking application health..."
        curl -s http://localhost:3000/api/health | python3 -m json.tool
        exit 0
        ;;
    --stop)
        stop_all_services
        exit 0
        ;;
    *)
        main
        ;;
esac 