# 🏆 CertChain - Blockchain Certificate Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![Blockchain](https://img.shields.io/badge/Blockchain-Ethereum-purple.svg)](https://ethereum.org)

A modern, **blockchain-first certificate issuance and verification platform** built with Next.js, Smart Contracts, and MySQL. Issue tamper-proof NFT certificates with one-command deployment.

## 🚀 **Quick Start - Get Running in 5 Minutes**

### **Step 1: Deploy the Web Application (2 minutes)**

```bash
# 1. Ensure Docker Desktop is running
docker --version

# 2. Deploy web app and database with one command
scripts\deploy.bat          # Windows
./scripts/deploy.sh         # Linux/Mac

# 3. Access your application
🌐 Web App:      http://localhost:3000
📊 Database UI:  http://localhost:8080
🔍 Health Check: http://localhost:3000/api/health
```

### **Step 2: Deploy Smart Contract (2 minutes)**

```bash
# 1. Install Node.js dependencies
npm install

# 2. Download and open Ganache GUI from https://trufflesuite.com/ganache/
# 3. Create new workspace or use quickstart (port 7545, chain ID 1337)

# 4. Automated deployment (deploys contract + updates everything)
node scripts/deploy-contract.js

# Alternative: Use platform-specific scripts
scripts\deploy-contract.bat     # Windows
./scripts/deploy-contract.sh    # Linux/Mac
```

**That's it!** Your complete blockchain certificate system is now running. 🎉

### **🔄 Contract Address Automation**

One of the challenges with local blockchain development is that contract addresses change with each deployment. CertChain solves this with automated scripts:

- **📦 Full Automation**: `node scripts/deploy-contract.js` handles everything
- **⚙️ Semi-Automation**: `node scripts/update-contract-address.js` updates configs only
- **🔄 Auto-Updates**: Both `.env.local` and `docker-compose.yml` get updated
- **🐳 Auto-Rebuild**: Docker container rebuilds with new address
- **✅ Auto-Verify**: Health check confirms everything is working

No more manual file editing or forgetting to restart containers!

---

## 📋 **Table of Contents**

- [✨ Key Features](#-key-features)
- [🏗️ Architecture](#️-architecture)
- [🎯 User Roles](#-user-roles--capabilities)
- [🛠️ Technology Stack](#️-technology-stack)
- [⚙️ Setup & Deployment](#️-setup--deployment)
- [📜 Manual Smart Contract Deployment](#-manual-smart-contract-deployment)
- [🔧 Development](#-development)
- [📊 Monitoring & Health](#-monitoring--health)
- [🌐 API Reference](#-api-reference)
- [🚨 Troubleshooting](#-troubleshooting)
- [📁 Project Structure](#-project-structure)

---

## ✨ **Key Features**

### 🔐 **Blockchain-First Authentication**

- **MetaMask wallet** as the only authentication method
- **Smart contract roles** as single source of truth for permissions
- **Real-time role verification** and automatic updates
- **No email/username/passwords** - wallet address is primary identifier

### 📜 **NFT Certificate System**

- **ERC-721 NFT certificates** minted on blockchain
- **IPFS storage** for decentralized document hosting
- **QR code verification** for instant validation
- **Tamper-proof** certificate records that recipients truly own

### 📊 **Comprehensive Activity Logging**

- **Real-time activity tracking** for all system events
- **Advanced filtering** by type, user, date range
- **Blockchain transaction links** for complete transparency
- **Audit-ready logs** for compliance and monitoring

### 🏗️ **Hybrid Architecture**

- **Blockchain**: Authentication, roles, certificates (immutable & secure)
- **MySQL**: User profiles, activity logs, analytics (fast queries)
- **IPFS**: Decentralized file storage (censorship resistant)
- **Docker**: One-command deployment (developer friendly)

---

## 🏗️ **Architecture**

```
┌────────────────────────────────────┐
│        FRONTEND (Next.js)          │ ← React-based UI with Tailwind
│  • MetaMask integration            │
│  • Real-time role detection        │
│  • Certificate management          │
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

## 🎯 **User Roles & Capabilities**

| Role         | Capabilities                                                 | Blockchain Permission |
| ------------ | ------------------------------------------------------------ | --------------------- |
| **ADMIN**    | Grant/revoke roles, system management, access all features   | `ADMIN_ROLE`          |
| **ISSUER**   | Issue certificates, manage own certificates, view activities | `ISSUER_ROLE`         |
| **VERIFIER** | Verify certificates, read-only access to verification        | `VERIFIER_ROLE`       |
| **HOLDER**   | View owned certificates, download/share certificates         | Default (any wallet)  |

**Role Hierarchy:** ADMIN > ISSUER > VERIFIER > HOLDER

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

## ⚙️ **Setup & Deployment**

### **Prerequisites**

- [Docker Desktop](https://docker.com/products/docker-desktop) (required)
- [Node.js 18+](https://nodejs.org) (required for smart contracts)
- [MetaMask](https://metamask.io) browser extension

### **Environment Configuration**

The deployment script automatically creates `.env.local`, and contract deployment scripts update both `.env.local` and `docker-compose.yml`:

```bash
# MySQL Configuration (handled by Docker)
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=certchain_user
MYSQL_PASSWORD=certchain_password
MYSQL_DATABASE=certchain

# Blockchain Configuration (auto-updated by deployment scripts)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x85C553D13BdD2213910043E387072AC412c33653
NEXT_PUBLIC_CHAIN_ID=1337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:7545
```

**Note**: Contract addresses are automatically updated in both configuration files when using the automated deployment scripts.

### **Complete Deployment Process**

#### **Step 1: Deploy Web Application & Database**

```bash
# Windows users
scripts\deploy.bat

# Linux/Mac users
./scripts/deploy.sh
```

**What happens during this step:**

1. ✅ Checks Docker installation
2. ✅ Creates environment configuration
3. ✅ Builds Next.js application container
4. ✅ Starts MySQL with automatic schema import
5. ✅ Tests database and application connectivity
6. ⚠️ Shows smart contract deployment instructions

#### **Step 2: Manual Smart Contract Deployment**

After the web application is running, you need to deploy the smart contract using Ganache GUI:

1. **Download Ganache GUI**: Visit [https://trufflesuite.com/ganache/](https://trufflesuite.com/ganache/) and download for your OS
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Open Ganache GUI** and either:
   - Click "QUICKSTART" (uses port 7545, chain ID 1337 automatically)
   - Or create "NEW WORKSPACE" with these settings:
     - Server Host: 127.0.0.1
     - Server Port: 7545
     - Network ID: 1337
4. **Deploy contract**:
   ```bash
   npx hardhat run scripts/deploy.js --network ganache
   ```

**Sample deployment output:**

```
Deploying contract with account: 0x85C553D13BdD2213910043E387072AC412c33653
Account balance: 1000000000000000000000
Contract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Transaction hash: 0xa1b2c3d4...
Gas used: 1234567
```

#### **Step 3: Smart Contract Deployment & Configuration**

You have two options for deploying contracts and updating your system configuration:

##### **Option A: Fully Automated Deployment (Recommended)**

Deploy contracts and update everything automatically with one command:

```bash
# Full automation - deploys contract and updates all configs
# Windows users
scripts\deploy-contract.bat

# Linux/Mac users
./scripts/deploy-contract.sh

# Or run the Node.js script directly
node scripts/deploy-contract.js
```

**What the automated script does:**

1. ✅ **Deploys** the smart contract via Hardhat to Ganache
2. ✅ **Extracts** the new contract address from deployment output
3. ✅ **Updates** both `.env.local` and `docker-compose.yml` files
4. ✅ **Rebuilds** Docker container with new contract address
5. ✅ **Restarts** the application with updated configuration
6. ✅ **Verifies** deployment health and connectivity

**Sample output:**

```
🚀 Deploying smart contract...
✅ CertificateNFT deployed to: 0x46104c256d9b4e561e5E8cd3B248C0275d1e388F
🔄 Updating configuration files...
✅ Updated docker-compose.yml
✅ Updated .env.local
🔨 Rebuilding Docker container...
🔄 Restarting Docker container...
🎉 Deployment complete!
📄 Contract Address: 0x46104c256d9b4e561e5E8cd3B248C0275d1e388F
```

##### **Option B: Manual Deployment with Semi-Automation**

If you prefer more control over the deployment process:

```bash
# 1. Deploy contract manually
npx hardhat run scripts/deploy.js --network ganache

# 2. Copy the contract address from output, then auto-update configs
node scripts/update-contract-address.js 0xYourNewContractAddress

# 3. Rebuild and restart (done automatically by update script)
# The update script tells you what to run next
```

##### **Option C: Fully Manual Process**

For complete manual control:

```bash
# 1. Deploy contract
npx hardhat run scripts/deploy.js --network ganache

# 2. Manually edit .env.local - update this line:
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourNewContractAddress

# 3. Manually edit docker-compose.yml - update this line:
NEXT_PUBLIC_CONTRACT_ADDRESS: 0xYourNewContractAddress

# 4. Rebuild and restart containers
docker-compose build webapp
docker-compose up -d webapp

# 5. Verify everything is working
curl http://localhost:3000/api/health
```

### **Alternative: Manual Docker Deployment**

If you prefer to handle Docker manually:

```bash
# Start containers manually
docker-compose up -d

# View logs
docker-compose logs -f webapp
docker-compose logs -f mysql

# Stop everything
docker-compose down
```

### **Port Configuration**

| Service        | Local Dev | Docker | External Access       |
| -------------- | --------- | ------ | --------------------- |
| **Web App**    | :3000     | :3000  | http://localhost:3000 |
| **MySQL**      | :3306     | :3307  | Via phpMyAdmin only   |
| **phpMyAdmin** | N/A       | :8080  | http://localhost:8080 |

**Note:** Docker MySQL uses port 3307 to avoid conflicts with local MySQL installations.

---

## 📜 **Manual Smart Contract Deployment**

This section provides detailed instructions for deploying smart contracts after your web application is running.

### **Why Manual Deployment?**

Manual smart contract deployment provides:

- ✅ **Full Control**: You see exactly what's happening at each step
- ✅ **Better Debugging**: Easy to identify and fix issues
- ✅ **Reliability**: No complex automation that can fail unexpectedly
- ✅ **Learning**: Understand the blockchain deployment process

### **Why Ganache GUI?**

**🖥️ Ganache GUI Benefits:**

- ✅ **Visual Interface**: See accounts, transactions, and blocks in real-time
- ✅ **Easy Setup**: One-click workspace creation with perfect settings
- ✅ **Account Management**: Copy private keys with a single click
- ✅ **Transaction History**: Watch contracts deploy and transactions execute
- ✅ **Beginner Friendly**: No command-line knowledge required
- ✅ **Debugging**: Visual gas usage and transaction details
- ✅ **No CLI Issues**: Avoid command-line flag compatibility problems

### **Prerequisites for Smart Contract Deployment**

Before deploying smart contracts, ensure you have:

1. **✅ Web application running** (from Step 1 above)
2. **✅ Node.js installed** - Download from [nodejs.org](https://nodejs.org)
3. **✅ Docker containers healthy** - Check with health endpoint

### **Detailed Smart Contract Deployment Steps**

#### **Step 1: Install Dependencies**

```bash
# Navigate to your project directory (if not already there)
cd /path/to/your/certchain/project

# Install all Node.js dependencies
npm install

# Verify installation
npm list hardhat
npm list @openzeppelin/contracts
```

#### **Step 2: Install and Configure Ganache**

1. **Download Ganache**: Visit [https://trufflesuite.com/ganache/](https://trufflesuite.com/ganache/) and download the GUI application for your operating system

2. **Install and Launch**: Install the downloaded application and open it

3. **Create Workspace**: You have two options:

   **Quick Setup (Recommended):**

   - Click **"QUICKSTART"** button
   - This automatically creates a workspace with perfect settings:
     - RPC Server: `HTTP://127.0.0.1:7545`
     - Network ID: `1337`
     - 10 accounts with 1000 ETH each

   **Custom Workspace:**

   - Click **"NEW WORKSPACE"**
   - Configure these settings:
     - **Workspace Name**: `CertChain Development`
     - **Server Tab**:
       - Hostname: `127.0.0.1`
       - Port Number: `7545`
       - Network ID: `1337`
       - Automine: `Enabled`
     - **Accounts & Keys Tab**:
       - Account Default Balance: `1000`
       - Total Accounts to Generate: `10`
     - Click **"SAVE WORKSPACE"**

4. **Verify Setup**: You should see:
   - 10 accounts with addresses starting with `0x...`
   - Each account has 1000.00 ETH
   - RPC Server showing `HTTP://127.0.0.1:7545`

#### **Step 3: Deploy Smart Contract**

**With Ganache GUI running, deploy the smart contract:**

```bash
# Navigate to project directory (if not already there)
cd /path/to/your/certchain/project

# Deploy the contract to Ganache
npx hardhat run scripts/deploy.js --network ganache
```

**Expected terminal output:**

```
Starting deployment of CertificateNFT contract...
Deploying CertificateNFT...
✅ CertificateNFT deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
🔑 Deployed by: 0x85C553D13BdD2213910043E387072AC412c33653
💰 Account balance: 999999999999999999999

📋 Role Configuration:
Admin role: true
Issuer role: true
Verifier role: true

📄 Deployment Summary:
{
  "network": "ganache",
  "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "deployer": "0x85C553D13BdD2213910043E387072AC412c33653",
  "deploymentTime": "2024-01-20T10:30:00.000Z",
  "blockNumber": 1
}
```

**If using Ganache GUI**, you'll also see in the application:

- ✅ New transaction in the "TRANSACTIONS" tab
- ✅ New block created in the "BLOCKS" tab
- ✅ Contract deployment event
- ✅ Gas usage and transaction details

#### **Step 4: Update Environment Configuration**

Copy the contract address from the deployment output and update your `.env.local` file:

```bash
# Edit .env.local file
# Find this line:
NEXT_PUBLIC_CONTRACT_ADDRESS=0x85C553D13BdD2213910043E387072AC412c33653

# Replace with your new contract address:
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Alternative: Use sed command (Linux/Mac):**

```bash
sed -i 's/NEXT_PUBLIC_CONTRACT_ADDRESS=.*/NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3/' .env.local
```

#### **Step 5: Restart Web Application**

```bash
# Restart the web application to load the new contract
docker-compose restart webapp

# Wait a moment for restart
sleep 5

# Verify the application is running
curl http://localhost:3000/api/health
```

#### **Step 6: Verify Deployment**

```bash
# Check comprehensive health status
scripts\deploy.bat --health    # Windows
./scripts/deploy.sh --health   # Linux/Mac

# Or directly check health endpoint
curl -s http://localhost:3000/api/health | jq .
```

**Expected healthy output:**

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

### **Troubleshooting Smart Contract Deployment**

| Issue                                       | Symptoms                                     | Solution                                |
| ------------------------------------------- | -------------------------------------------- | --------------------------------------- |
| **Ganache connection fails**                | `Error: connect ECONNREFUSED 127.0.0.1:7545` | Ensure Ganache is running on port 7545  |
| **Hardhat compilation errors**              | Solidity compilation fails                   | Run `npx hardhat clean` then try again  |
| **Deployment hangs**                        | Command never completes                      | Check Ganache logs for errors           |
| **Health check shows blockchain unhealthy** | Blockchain status remains unhealthy          | Verify contract address in `.env.local` |
| **MetaMask can't connect**                  | Wallet connection fails                      | Add Ganache network to MetaMask         |

### **MetaMask Configuration for Development**

After successful deployment, configure MetaMask to connect to your local blockchain:

#### **1. Add Ganache Network to MetaMask**

1. **Open MetaMask** in your browser
2. **Click the network dropdown** (usually shows "Ethereum Mainnet")
3. **Click "Add Network"** at the bottom
4. **Enter these details:**
   - **Network Name**: `Ganache Local`
   - **New RPC URL**: `http://127.0.0.1:7545`
   - **Chain ID**: `1337`
   - **Currency Symbol**: `ETH`
   - **Block Explorer URL**: (leave blank)
5. **Click "Save"**

#### **2. Import Test Account**

**From Ganache GUI:**

1. **Open Ganache GUI** → Click on the key icon 🔑 next to any account
2. **Copy the private key** (starts with `0x...`)
3. **In MetaMask** → Click account icon → "Import Account"
4. **Paste the private key** and click "Import"

#### **3. Verify Connection**

1. **Switch to Ganache Local network** in MetaMask
2. **Check account balance** - should show ~999 ETH (after deployment gas costs)
3. **Visit your application**: `http://localhost:3000`
4. **Click "Connect Wallet"** and approve the connection
5. **You should see:**
   - Your wallet address displayed
   - Admin role detected (first account has all privileges)
   - Access to certificate issuance features

#### **4. Test the Complete System**

- ✅ **Issue a certificate** from the admin dashboard
- ✅ **Watch the transaction** in Ganache (GUI shows live transactions)
- ✅ **Verify the certificate** using the verification page
- ✅ **Check activity logs** in the admin panel

---

## 🔧 **Development**

### **Local Development Setup**

```bash
# Install dependencies
npm install

# Start Ganache blockchain (if using local development)
# Deploy smart contract
npx hardhat run scripts/deploy.js --network ganache

# Start development server
npm run dev
```

### **Useful Development Commands**

```bash
# Health check
curl http://localhost:3000/api/health

# View application logs
docker-compose logs webapp

# View database logs
docker-compose logs mysql

# Automated contract deployment (recommended)
node scripts/deploy-contract.js

# Manual contract deployment
npx hardhat run scripts/deploy.js --network ganache

# Update contract address only
node scripts/update-contract-address.js 0xYourContractAddress

# Run smart contract tests
npx hardhat test
```

### **MetaMask Setup for Development**

1. **Add Ganache Network:**

   - Network Name: `Ganache`
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`

2. **Import Ganache Account:**
   - Copy private key from Ganache
   - Import to MetaMask
   - This account has admin privileges

---

## 📊 **Monitoring & Health**

### **Health Check Endpoint**

```bash
# Check overall system health
curl http://localhost:3000/api/health

# Using deployment script
scripts\deploy.bat --health
```

**Sample Health Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-06-09T16:12:38.179Z",
  "services": {
    "database": {
      "status": "healthy",
      "message": "Database connection successful"
    },
    "blockchain": { "status": "unhealthy", "message": "RPC connection failed" },
    "application": { "status": "healthy", "message": "Application is running" }
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

Access logs via the admin dashboard at `/admin`.

---

## 🌐 **API Reference**

### **Authentication APIs**

- `POST /api/auth/login` - Wallet-based authentication
- `POST /api/auth/logout` - Session cleanup
- `GET /api/auth/verify-role` - Role verification
- `POST /api/auth/get-profile` - User profile retrieval

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
- `GET /db-test` - Database connectivity test

---

## 🚨 **Troubleshooting**

### **Common Issues & Solutions**

| Issue                            | Symptoms                                | Solution                                                                    |
| -------------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| **Port 3306 in use**             | MySQL container fails to start          | Docker automatically uses port 3307                                         |
| **Docker not running**           | Container start failures                | Start Docker Desktop                                                        |
| **Blockchain connection failed** | Health check shows blockchain unhealthy | Start Ganache on port 7545, uses host.docker.internal for Docker networking |
| **MetaMask not connecting**      | Wallet connection fails                 | Check network settings (Chain ID: 1337)                                     |
| **Certificate issuance fails**   | "missing revert data" error             | Import Ganache account or grant ISSUER role                                 |

### **Diagnostic Commands**

```bash
# Check Docker status
docker ps

# View detailed logs
docker-compose logs -f webapp
docker-compose logs -f mysql

# Test database connection
docker exec -it certchain-mysql mysql -u root -pmysql

# Check health status
scripts\deploy.bat --health

# Test blockchain connection
node scripts/test-connection.js
```

### **Reset Everything**

```bash
# Stop and remove all containers
docker-compose down -v

# Remove Docker images (optional)
docker system prune -f

# Restart deployment
scripts\deploy.bat
```

---

## 📁 **Project Structure**

```
CertChain/
├── 📁 components/              # React UI components
│   ├── ui/                    # shadcn/ui components
│   ├── ActivityLogViewer.js   # Admin activity dashboard
│   ├── Navbar.js              # Navigation component
│   └── ProtectedRoute.js      # Route protection
├── 📁 contexts/               # React context providers
│   └── AuthContext.js         # Authentication state
├── 📁 contracts/              # Smart contract source
│   └── CertificateNFT.sol     # Main certificate contract
├── 📁 lib/                    # Core utilities
│   ├── auth-client.js         # Client-side auth utilities
│   └── db.js                  # Database connection
├── 📁 pages/                  # Next.js pages & API routes
│   ├── api/                   # Backend API endpoints
│   │   ├── activity/          # Activity logging APIs
│   │   ├── admin/            # Admin management APIs
│   │   ├── auth/             # Authentication APIs
│   │   ├── blockchain/       # Blockchain interaction APIs
│   │   └── health/           # Health check endpoint
│   ├── admin.js              # Admin dashboard
│   ├── holder.js             # Certificate holder dashboard
│   ├── index.js              # Landing page
│   ├── issuer.js             # Certificate issuer dashboard
│   ├── login.js              # Authentication page
│   └── verify.js             # Public verification page
├── 📁 scripts/                # Deployment & utility scripts
│   ├── deploy.bat            # Windows web app deployment
│   ├── deploy.sh             # Linux/Mac web app deployment
│   ├── deploy.js             # Smart contract deployment
│   ├── deploy-contract.js    # Automated contract deployment
│   ├── deploy-contract.bat   # Windows contract deployment wrapper
│   ├── deploy-contract.sh    # Linux/Mac contract deployment wrapper
│   ├── update-contract-address.js # Contract address updater
│   ├── certchain.session.sql # Database schema
│   └── create-activity-table.sql # Activity logging schema
├── 📁 styles/                 # CSS and styling
├── 📁 utils/                  # Helper utilities
│   ├── contract.js           # Blockchain interaction
│   ├── mysql.js              # Database utilities
│   └── wallet.js             # Wallet connection utilities
├── 📄 docker-compose.yml     # Container orchestration
├── 📄 Dockerfile             # Next.js application container
├── 📄 hardhat.config.js      # Blockchain development config
├── 📄 next.config.js         # Next.js configuration
├── 📄 package.json           # Node.js dependencies
└── 📄 .env.local             # Environment configuration
```

---

## 🎯 **Production Deployment**

For production environments:

1. **Update Blockchain Configuration:**

   ```bash
   NEXT_PUBLIC_CHAIN_ID=1  # Mainnet
   NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/YOUR-PROJECT-ID
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x...your-deployed-contract
   ```

2. **Database Setup:**

   - Use managed database (AWS RDS, Google Cloud SQL)
   - Update MySQL connection settings
   - Enable SSL/TLS connections

3. **Infrastructure:**

   - Deploy to cloud provider (AWS, GCP, Azure)
   - Set up domain and SSL certificates
   - Configure load balancing
   - Set up monitoring and alerting

4. **Security:**
   - Use environment variables for secrets
   - Enable HTTPS only
   - Set up proper CORS policies
   - Regular security audits

---

## 🤝 **Contributing**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

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

🚀 **Ready to deploy?** Run `scripts\deploy.bat` and get started in minutes!

[![Deploy](https://img.shields.io/badge/Deploy-Now-success.svg)](.)
[![Docs](https://img.shields.io/badge/Docs-Complete-blue.svg)](.)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](.)

</div>
