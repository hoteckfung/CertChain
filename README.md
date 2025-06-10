# 🏆 CertChain - Blockchain Certificate Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![Blockchain](https://img.shields.io/badge/Blockchain-Ethereum-purple.svg)](https://ethereum.org)

A modern, **blockchain-first certificate issuance and verification platform** built with Next.js, Smart Contracts, and MySQL. Issue tamper-proof NFT certificates with secure role-based access control.

## 🚀 **Quick Start - Get Running in 10 Minutes**

Get CertChain running with a simple 4-step process!

### Prerequisites

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org)
- **Docker Desktop** - [Download here](https://docker.com/products/docker-desktop)
- **Git** - [Download here](https://git-scm.com)

### Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/hoteckfung/CertChain.git
cd V2
npm install
```

### Step 2: Deploy Web Application & Database

```bash
# Windows users
scripts\deploy.bat

# Linux/Mac users
./scripts/deploy.sh

# Or manually with Docker
docker-compose up -d
```

**This automatically sets up:**

- ✅ MySQL database with schema and sample data
- ✅ Next.js web application
- ✅ phpMyAdmin for database management
- ✅ Health monitoring endpoints

### Step 3: Set Up Blockchain (Ganache + Smart Contract)

#### 3.1 Install and Configure Ganache

1. **Download Ganache GUI**: Visit [https://trufflesuite.com/ganache/](https://trufflesuite.com/ganache/)
2. **Install and open** the application
3. **Create workspace**:
   - Click **"QUICKSTART"** (recommended) - auto-configures everything correctly
   - OR create **"NEW WORKSPACE"** with these settings:
     - Server: `HTTP://127.0.0.1:7545`
     - Chain ID: `1337`

#### 3.2 Deploy Smart Contract

```bash
# Deploy the certificate NFT contract
npx hardhat run scripts/deploy.js --network ganache
```

**Copy the contract address from the output**, then update your configuration:

```bash
# Update environment files with your new contract address
node scripts/update-contract-address.js 0xYourNewContractAddress
```

This automatically:

- ✅ Updates `.env.local`
- ✅ Updates `docker-compose.yml`
- ✅ Rebuilds Docker container
- ✅ Restarts the application

### Step 4: Configure MetaMask & Test

1. **Add Ganache network to MetaMask**:

   - Network Name: `Ganache Local`
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: `1337`
   - Currency: `ETH`

2. **Import test account**:

   - In Ganache GUI: Click 🔑 next to any account
   - Copy the private key
   - In MetaMask: Import Account → Paste private key

3. **Test the system**:
   - Visit: [http://localhost:3000](http://localhost:3000)
   - Connect wallet and verify role detection
   - Access admin dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard) (admin users)

### 🎉 You're Ready!

Your system is now running with:

- 🌐 **Web App**: [http://localhost:3000](http://localhost:3000)
- 📊 **Database Admin**: [http://localhost:8080](http://localhost:8080)
- 🔍 **Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- 🔑 **Admin Access**: First Ganache account has admin privileges

---

## 📋 **Table of Contents**

- [✨ Key Features](#-key-features)
- [🏗️ Architecture](#️-architecture)
- [👥 User Roles](#-user-roles--capabilities)
- [🛠️ Technology Stack](#️-technology-stack)
- [🧑‍💻 Development Guide](#-development-guide)
- [🐳 Docker Deployment](#-docker-deployment)
- [📜 Smart Contract Management](#-smart-contract-management)
- [📊 Monitoring & Health](#-monitoring--health)
- [🌐 API Reference](#-api-reference)
- [🚨 Troubleshooting](#-troubleshooting)
- [📁 Project Structure](#-project-structure)

---

## ✨ **Key Features**

### 🔐 **Blockchain-First Authentication**

- **MetaMask wallet** as the only authentication method
- **Smart contract roles** as single source of truth for permissions
- **Real-time role verification** with automatic updates
- **No passwords** - wallet address is your identity

### 📜 **NFT Certificate System**

- **ERC-721 NFT certificates** minted on blockchain
- **IPFS storage** for decentralized document hosting
- **QR code verification** for instant validation
- **Tamper-proof** records that recipients truly own

### 📊 **Comprehensive Activity Logging**

- **Real-time activity tracking** for all system events
- **Advanced filtering** by type, user, date range
- **Blockchain transaction links** for complete transparency
- **Audit-ready logs** for compliance and monitoring

### 🏗️ **Hybrid Architecture**

- **Blockchain**: Authentication, roles, certificates (immutable)
- **MySQL**: User profiles, activity logs, analytics (fast queries)
- **IPFS**: Decentralized file storage (censorship resistant)
- **Docker**: One-command deployment (developer friendly)

---

## 🏗️ **Architecture**

```
┌────────────────────────────────────┐
│        FRONTEND (Next.js)          │ ← React UI with Tailwind CSS
│  • MetaMask integration            │
│  • Real-time role detection        │
│  • Certificate management UI       │
└────────────────────────────────────┘
                    ↓
┌────────────────────────────────────┐
│        DATABASE (MySQL)            │ ← Fast queries & analytics
│  • User profiles & preferences     │
│  • Activity logs & audit trail     │
│  • Session management              │
└────────────────────────────────────┘
                    ↓
┌────────────────────────────────────┐
│      BLOCKCHAIN (Ethereum)         │ ← Single source of truth
│  • Smart contract roles (RBAC)     │
│  • NFT certificates (ERC-721)      │
│  • Immutable audit trail           │
└────────────────────────────────────┘
```

**Why This Architecture Works:**

- ✅ **Security**: Blockchain handles critical auth & certificates
- ✅ **Performance**: MySQL handles fast queries & analytics
- ✅ **Scalability**: Each layer scales independently
- ✅ **Cost-Effective**: No expensive blockchain storage for logs

---

## 👥 **User Roles & Capabilities**

| Role         | Capabilities                                                 | Blockchain Permission |
| ------------ | ------------------------------------------------------------ | --------------------- |
| **ADMIN**    | Grant/revoke roles, system management, access all features   | `ADMIN_ROLE`          |
| **ISSUER**   | Issue certificates, manage own certificates, view activities | `ISSUER_ROLE`         |
| **HOLDER**   | View owned certificates, download/share certificates         | Default (any wallet)  |
| **VERIFIER** | Verify certificates, read-only access to verification        | Public access         |

**Role Hierarchy:** ADMIN > ISSUER > HOLDER
**Important:** Verifiers don't need authentication - verification is public and permissionless.

---

## 🛠️ **Technology Stack**

### **Frontend & UI**

- **Next.js 13** - React framework with API routes & SSR
- **Tailwind CSS** - Utility-first styling framework
- **shadcn/ui** - Beautiful, accessible React components
- **Ethers.js** - Ethereum blockchain interaction library

### **Backend & Database**

- **MySQL 8.0** - Relational database for profiles & logs
- **Next.js API Routes** - Serverless backend functions
- **Connection pooling** - Optimized database performance

### **Blockchain & Web3**

- **Solidity** - Smart contract programming language
- **OpenZeppelin** - Security-audited contract libraries
- **Hardhat** - Ethereum development environment
- **Ganache** - Local blockchain for development
- **MetaMask** - Web3 wallet integration

### **Infrastructure & DevOps**

- **Docker & Docker Compose** - Containerized deployment
- **IPFS** - Decentralized file storage
- **Health monitoring** - Built-in system diagnostics

---

## 🧑‍💻 **Development Guide**

### **Prerequisites for Development**

```bash
# Check versions
node --version    # Should be v16+
npm --version     # Should be 8+
docker --version  # Any recent version
```

### **Initial Setup**

```bash
# 1. Clone and install
git clone <your-repo-url>
cd V2
npm install

# 2. Start database and web app
scripts\deploy.bat              # Windows
./scripts/deploy.sh             # Linux/Mac

# 3. Verify health
curl http://localhost:3000/api/health
```

### **Smart Contract Development Workflow**

```bash
# 1. Start Ganache GUI (keep running during development)
# Download from: https://trufflesuite.com/ganache/
# Click "QUICKSTART" for instant setup

# 2. Deploy contracts (run this when contracts change)
npx hardhat run scripts/deploy.js --network ganache

# 3. Update configuration with new contract address
node scripts/update-contract-address.js 0xNewContractAddress

# 4. Test smart contract functions
npx hardhat test

# 5. Grant additional issuer roles (optional)
node scripts/grant-issuer-role.js
```

### **Frontend Development**

```bash
# Start development server (alternative to Docker)
npm run dev

# The app will be available at http://localhost:3000
# Hot reload is enabled for rapid development
```

### **Database Development**

```bash
# Access MySQL directly
docker exec -it certchain-mysql mysql -u root -pmysql

# Reset database (clears all data)
npm run db:reset

# View database in browser
open http://localhost:8080  # phpMyAdmin
```

### **Development Commands Reference**

```bash
# Health & Status
curl http://localhost:3000/api/health
npm run db:test
docker-compose logs webapp

# Database Management
npm run db:setup      # Initialize database
npm run db:reset      # Clear and recreate database
npm run db:test       # Test database connection

# Smart Contract
npx hardhat compile   # Compile contracts
npx hardhat test      # Run contract tests
npx hardhat clean     # Clear compilation artifacts

# Docker Management
docker-compose up -d             # Start all services
docker-compose down              # Stop all services
docker-compose restart webapp    # Restart web app only
docker-compose logs -f mysql     # View database logs
```

### **Development Workflow**

1. **Start Development Session**:

   ```bash
   # Start Ganache GUI (leave running)
   # Start Docker services
   scripts\deploy.bat
   ```

2. **Make Code Changes**:

   - Frontend: Edit files in `pages/`, `components/`, `styles/`
   - Smart Contracts: Edit files in `contracts/`
   - Database: Use phpMyAdmin or direct SQL

3. **Test Changes**:

   ```bash
   # For frontend changes - automatic hot reload
   npm run dev

   # For smart contract changes
   npx hardhat test
   npx hardhat run scripts/deploy.js --network ganache
   node scripts/update-contract-address.js 0xNewAddress
   ```

4. **Debug Issues**:

   ```bash
   # Check application health
   curl http://localhost:3000/api/health

   # View logs
   docker-compose logs webapp

   # Test database
   npm run db:test
   ```

### **MetaMask Development Setup**

1. **Add Ganache Network**:

   - Name: `Ganache Local`
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: `1337`
   - Currency: `ETH`

2. **Import Development Accounts**:

   - In Ganache: Click 🔑 next to account
   - Copy private key
   - In MetaMask: Account menu → Import Account

3. **Test Role-Based Access**:
   - First account: Has ADMIN role (can manage system)
   - Additional accounts: Can be granted ISSUER role
   - Any account: Can be a certificate holder

---

## 🐳 **Docker Deployment**

### **Production-Ready Deployment**

```bash
# Full system deployment
scripts\deploy.bat              # Windows
./scripts/deploy.sh             # Linux/Mac

# Manual Docker commands
docker-compose up -d            # Start services
docker-compose down             # Stop services
docker-compose logs -f          # View logs
```

### **Service Configuration**

| Service        | Port | Internal Port | Access                |
| -------------- | ---- | ------------- | --------------------- |
| **Web App**    | 3000 | 3000          | http://localhost:3000 |
| **MySQL**      | 3307 | 3306          | Via phpMyAdmin only   |
| **phpMyAdmin** | 8080 | 80            | http://localhost:8080 |

### **Environment Variables**

```bash
# Database Configuration (auto-configured by Docker)
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=certchain_user
MYSQL_PASSWORD=certchain_password
MYSQL_DATABASE=certchain

# Blockchain Configuration (update after contract deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_CHAIN_ID=1337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:7545

# Application Settings
NODE_ENV=production
```

---

## 📜 **Smart Contract Management**

### **Contract Deployment**

```bash
# Deploy new contract
npx hardhat run scripts/deploy.js --network ganache

# Update system configuration
node scripts/update-contract-address.js 0xYourNewContractAddress
```

### **Role Management**

```bash
# Grant issuer role to an address (optional)
node scripts/grant-issuer-role.js

# Check roles in Ganache
# Use debug script if available
node scripts/debug-roles.js
```

### **Contract Development**

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Clean build artifacts
npx hardhat clean
```

### **Available Networks**

```javascript
// hardhat.config.js networks
ganache: {
  url: "http://127.0.0.1:7545",
  chainId: 1337,
  accounts: [...] // Auto-configured
}
```

---

## 📊 **Monitoring & Health**

### **Health Check Endpoints**

```bash
# Overall system health
curl http://localhost:3000/api/health

# Database-specific test
curl http://localhost:3000/api/db-test

# Using deployment scripts
scripts\deploy.bat --health     # Windows
./scripts/deploy.sh --health    # Linux/Mac
```

### **Sample Health Response**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "services": {
    "database": {
      "status": "healthy",
      "message": "Database connection successful"
    },
    "blockchain": {
      "status": "healthy",
      "message": "Blockchain connection successful"
    },
    "application": {
      "status": "healthy",
      "message": "Application is running"
    }
  }
}
```

### **Activity Logging**

The system automatically logs:

- `CERTIFICATE_ISSUED` - NFT certificate minted
- `ROLE_GRANTED/REVOKED` - Blockchain role changes
- `USER_LOGIN/LOGOUT` - Wallet connections
- `VERIFICATION_PERFORMED` - Certificate verifications
- `CONTRACT_DEPLOYED` - Smart contract deployments

Access logs via the admin dashboard at `/dashboard` (admin users).

### **Monitoring Tools**

| Tool                                 | Purpose                       | Usage                                    |
| ------------------------------------ | ----------------------------- | ---------------------------------------- |
| `GET /api/health`                    | Overall system status         | `curl http://localhost:3000/api/health`  |
| `GET /api/db-test`                   | Database connectivity         | `curl http://localhost:3000/api/db-test` |
| `node scripts/test-db-connection.js` | Detailed database diagnostics | Terminal output with full details        |
| `/dashboard` (admin users)           | Visual database status        | Admin UI for database monitoring         |

---

## 🌐 **API Reference**

### **Authentication APIs**

- `POST /api/auth/login` - Wallet-based authentication
- `POST /api/auth/logout` - Session cleanup
- `GET /api/auth/verify-role` - Role verification

### **Blockchain APIs**

- `POST /api/blockchain/issue-certificate` - Issue NFT certificate
- `GET /api/blockchain/verify-certificate` - Verify certificate by hash/ID

### **Activity APIs**

- `POST /api/activity/log` - Log system activities
- `GET /api/activity/get-logs` - Retrieve activity logs (with filtering)

### **Admin APIs**

- `GET/PUT/DELETE /api/admin/users` - User management (admin only)

### **System APIs**

- `GET /api/health` - System health status
- `GET /api/db-test` - Database connectivity test

---

## 🚨 **Troubleshooting**

### **Common Issues & Solutions**

| Issue                            | Symptoms                                | Solution                                                  |
| -------------------------------- | --------------------------------------- | --------------------------------------------------------- |
| **Docker not running**           | Container start failures                | Start Docker Desktop                                      |
| **Port conflicts**               | "Port already in use" error             | Docker uses 3307 for MySQL to avoid conflicts             |
| **Blockchain connection failed** | Health check shows blockchain unhealthy | Start Ganache on port 7545, check contract address        |
| **MetaMask not connecting**      | Wallet connection fails                 | Add Ganache network (Chain ID: 1337, RPC: 127.0.0.1:7545) |
| **Certificate issuance fails**   | "missing revert data" error             | Import Ganache account with ISSUER role to MetaMask       |
| **Database connection failed**   | MySQL errors in logs                    | Wait 30 seconds for MySQL to start, check Docker logs     |

### **Diagnostic Commands**

```bash
# Check Docker status
docker ps
docker-compose logs webapp
docker-compose logs mysql

# Check application health
curl http://localhost:3000/api/health
npm run db:test

# Check blockchain connection
# Ensure Ganache GUI is running on port 7545

# Reset everything if needed
docker-compose down -v
scripts\deploy.bat              # Windows
./scripts/deploy.sh             # Linux/Mac
```

### **Getting Help**

1. **Check health endpoint**: `curl http://localhost:3000/api/health`
2. **View Docker logs**: `docker-compose logs -f`
3. **Test database**: `npm run db:test`
4. **Verify Ganache**: Ensure GUI is running on port 7545
5. **Check contract address**: Verify in `.env.local` matches deployed contract

---

## 📁 **Project Structure**

```
CertChain/
├── 📁 components/              # React UI components
│   ├── ui/                    # shadcn/ui component library
│   ├── Navbar.js              # Navigation component
│   └── ConnectButton.js       # Wallet connection
├── 📁 contexts/               # React context providers
│   └── AuthContext.js         # Authentication state management
├── 📁 contracts/              # Smart contract source code
│   └── CertificateNFT.sol     # Main certificate NFT contract
├── 📁 lib/                    # Core utility libraries
│   ├── auth-client.js         # Client-side auth utilities
│   ├── auth-server.js         # Server-side auth utilities
│   └── mysql.js               # Database connection utilities
├── 📁 pages/                  # Next.js pages & API routes
│   ├── api/                   # Backend API endpoints
│   │   ├── activity/          # Activity logging APIs
│   │   ├── admin/            # Admin management APIs
│   │   ├── auth/             # Authentication APIs
│   │   ├── blockchain/       # Blockchain interaction APIs
│   │   └── health.js         # System health check endpoint
│   ├── dashboard.js          # Unified dashboard (all user types)
│   ├── index.js              # Landing page
│   ├── login.js              # Authentication page
│   └── verify.js             # Public certificate verification
├── 📁 scripts/                # Deployment & utility scripts
│   ├── deploy.bat            # Windows Docker deployment
│   ├── deploy.sh             # Linux/Mac Docker deployment
│   ├── deploy.js             # Smart contract deployment
│   ├── update-contract-address.js # Contract address updater
│   ├── grant-issuer-role.js  # Role management utility
│   ├── debug-roles.js        # Role debugging utility
│   └── FINAL_database_setup.sql # Complete database schema
├── 📁 utils/                  # Helper utilities
│   └── mysql.js              # Database helper functions
├── 📄 docker-compose.yml     # Container orchestration
├── 📄 Dockerfile             # Next.js application container
├── 📄 hardhat.config.js      # Blockchain development config
├── 📄 next.config.js         # Next.js configuration
├── 📄 package.json           # Node.js dependencies & scripts
└── 📄 .env.local             # Environment configuration
```

---

## 🎯 **Production Deployment**

For production environments:

### **1. Blockchain Configuration**

```bash
# Update for mainnet or testnet
NEXT_PUBLIC_CHAIN_ID=1  # Mainnet (or 5 for Goerli testnet)
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/YOUR-PROJECT-ID
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...your-deployed-contract
```

### **2. Database Setup**

- Use managed database (AWS RDS, Google Cloud SQL, Azure Database)
- Update MySQL connection settings in `.env.local`
- Enable SSL/TLS connections
- Set up automated backups

### **3. Infrastructure**

- Deploy to cloud provider (AWS, GCP, Azure, DigitalOcean)
- Set up domain and SSL certificates
- Configure load balancing for high availability
- Set up monitoring and alerting

### **4. Security Checklist**

- ✅ Use environment variables for all secrets
- ✅ Enable HTTPS only (disable HTTP)
- ✅ Set up proper CORS policies
- ✅ Regular security audits of smart contracts
- ✅ Database access restrictions
- ✅ Rate limiting on API endpoints

---

## 🤝 **Contributing**

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create your feature branch**: `git checkout -b feature/AmazingFeature`
3. **Make your changes**: Follow the development guide above
4. **Test thoroughly**: Ensure all components work together
5. **Commit your changes**: `git commit -m 'Add some AmazingFeature'`
6. **Push to the branch**: `git push origin feature/AmazingFeature`
7. **Open a Pull Request**: Describe your changes and their benefits

### **Development Standards**

- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation for any API changes
- Ensure Docker deployment still works
- Test with fresh database setup

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- [**OpenZeppelin**](https://openzeppelin.com/) - Smart contract security standards
- [**Hardhat**](https://hardhat.org/) - Ethereum development environment
- [**Next.js**](https://nextjs.org/) - React production framework
- [**Tailwind CSS**](https://tailwindcss.com/) - Utility-first CSS framework
- [**shadcn/ui**](https://ui.shadcn.com/) - Beautiful React components

---

<div align="center">

**Built with ❤️ for the blockchain community**

🚀 **Ready to deploy?** Run `scripts\deploy.bat` (Windows) or `./scripts/deploy.sh` (Linux/Mac) and get started in 10 minutes!

[![Deploy](https://img.shields.io/badge/Deploy-Now-success.svg)](.)
[![Docs](https://img.shields.io/badge/Docs-Complete-blue.svg)](.)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](.)

</div>
