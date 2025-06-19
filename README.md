# 🏆 CertChain - Blockchain Certificate Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![Blockchain](https://img.shields.io/badge/Blockchain-Ethereum-purple.svg)](https://ethereum.org)

A modern, **blockchain-first certificate issuance and verification platform** built with Next.js, Smart Contracts, and MySQL. Issue tamper-proof NFT certificates with secure role-based access control and comprehensive activity monitoring.

---

## 🚀 **Complete Manual Setup Guide**

This guide provides step-by-step manual instructions to set up CertChain from scratch without any automation scripts. Follow each step carefully to ensure proper configuration.

---

## 📋 **Prerequisites Installation**

Before starting, you'll need to download and install these components:

- ✅ **Docker Desktop** - [Download here](https://docker.com/products/docker-desktop)
- ✅ **Node.js (v16+)** - [Download here](https://nodejs.org)
- ✅ **Git** - [Download here](https://git-scm.com)
- ✅ **MetaMask Browser Extension** - [Install here](https://metamask.io)
- ✅ **Ganache GUI** - [Download here](https://trufflesuite.com/ganache/)
- ✅ **IPFS Desktop** - [Download here](https://desktop.ipfs.io/)

---

## **Step 1: Clone Repository & Install Dependencies**

```bash
# Clone the repository
git clone https://github.com/your-username/CertChain.git
cd CertChain

# Install Node.js dependencies
npm install
```

---

## **Step 2: Setup Ganache Blockchain (CRITICAL)**

### **2.1 Download and Install Ganache GUI**

1. Visit: https://trufflesuite.com/ganache/
2. Download Ganache GUI for your operating system
3. Install and launch Ganache GUI

### **2.2 Configure Ganache Settings**

1. **Start a New Workspace:**

   - Click **"NEW WORKSPACE"**
   - Choose **"Ethereum"** blockchain type

2. **Configure Server Settings:**

   - Click **"SERVER"** tab
   - Set **Hostname:** `127.0.0.1`
   - Set **Port Number:** `7545`
   - Set **Network ID:** `1337`
   - Enable **"Automine"**
   - Set **Gas Limit:** `6721975`

3. **Configure Accounts & Keys:**

   - Click **"ACCOUNTS & KEYS"** tab
   - Set **Account Default Balance:** `100`
   - Enable **"Autogenerate HD Mnemonic"**
   - **Save the workspace** with a name like "CertChain"

4. **Start the Blockchain:**
   - Click **"START"** to launch your local blockchain
   - Verify you see 10 accounts with 100 ETH each

### **2.3 Get Your Private Key (CRITICAL)**

1. In Ganache GUI, locate the **first account** (index 0)
2. Click the **🔑 key icon** next to the first account
3. **Copy the Private Key** (starts with `0x`)
4. **Copy the Account Address** (the public address)
5. **Keep these safe** - you'll need them for `.env`

**✅ Verification:** Your Ganache should show:

- Status: **Running**
- RPC Server: **HTTP://127.0.0.1:7545**
- Network ID: **1337**
- 10 accounts with ~100 ETH each

---

## **Step 3: Setup IPFS Desktop (CRITICAL)**

### **3.1 Download and Install IPFS Desktop**

1. Visit: https://desktop.ipfs.io/
2. Download IPFS Desktop for your operating system
3. Install and launch IPFS Desktop

### **3.2 Initial IPFS Configuration**

1. **First Launch:**

   - Launch IPFS Desktop
   - Wait for it to initialize (this may take a few minutes)
   - Look for **"Connected"** status (green indicator)

2. **Critical Port Configuration (MUST DO):**

   - In IPFS Desktop, go to **Settings** → **IPFS Config**
   - Find the `"Addresses"` section in the JSON config
   - Locate the Gateway line: `"/ip4/127.0.0.1/tcp/8080"`
   - **Change it to:** `"/ip4/127.0.0.1/tcp/8081"`
   - Click **"Save and Restart"**

3. **Verify IPFS Configuration:**
   - After restart, IPFS Desktop should show **"Connected"**
   - The status indicator should be **green**

### **3.3 Test IPFS Installation**

```bash
# Test IPFS API (should return node info)
curl -X POST "http://127.0.0.1:5001/api/v0/id"

# Test IPFS Gateway (should show IPFS page)
curl "http://127.0.0.1:8081/ipfs/"
```

**✅ Verification:**

- IPFS Desktop shows **"Connected"** status
- API responds at: `http://127.0.0.1:5001`
- Gateway responds at: `http://127.0.0.1:8081`

---

## **Step 4: Setup Docker Desktop**

### **4.1 Install and Configure Docker**

1. **Download and Install:**

   - Visit: https://docker.com/products/docker-desktop
   - Download for your operating system
   - Install and launch Docker Desktop

2. **Configure Docker Resources:**

   - Open Docker Desktop settings
   - Go to **Resources** → **Advanced**
   - Set **Memory:** At least 4GB (8GB recommended)
   - Set **CPUs:** At least 2 cores
   - Click **"Apply & Restart"**

3. **Verify Docker Installation:**

   ```bash
   # Check Docker version
   docker --version

   # Check Docker Compose version
   docker-compose --version

   # Test Docker (should show Docker info)
   docker info
   ```

**✅ Verification:** Docker Desktop shows **"Running"** status and commands work

---

## **Step 5: Create Environment Configuration (CRITICAL)**

### **5.1 Create .env File**

Create a `.env` file in the project root directory with the following configuration:

```env
# MySQL Configuration (for Docker)
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=certchain_user
MYSQL_PASSWORD=certchain_password
MYSQL_DATABASE=certchain
MYSQL_ROOT_PASSWORD=mysql

# Blockchain Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:7545
NEXT_PUBLIC_CHAIN_ID=1337

# Deployer Configuration - REPLACE WITH YOUR GANACHE VALUES
DEPLOYER_ADDRESS=0xYourGanacheAccountAddressFromStep2
DEPLOYER_PRIVATE_KEY=0xYourGanachePrivateKeyFromStep2

# Server Wallet Configuration
SERVER_WALLET_PRIVATE_KEY=0xYourGanachePrivateKeyFromStep2

# Application Settings
NODE_ENV=development
```

### **5.2 Update Your Keys**

1. **Replace `DEPLOYER_ADDRESS`** with the account address from Step 2.3
2. **Replace `DEPLOYER_PRIVATE_KEY`** with the private key from Step 2.3
3. **Replace `SERVER_WALLET_PRIVATE_KEY`** with the same private key
4. **Save the file**

**⚠️ IMPORTANT:** The `NEXT_PUBLIC_CONTRACT_ADDRESS` will be updated after contract deployment in Step 8.

---

## **Step 6: Setup MetaMask Wallet**

### **6.1 Install MetaMask Extension**

1. Visit: https://metamask.io/
2. Click **"Download"** → **"Install MetaMask for [Your Browser]"**
3. Add the extension and create/import a wallet

### **6.2 Add Ganache Network to MetaMask**

1. **Open MetaMask** and click the network dropdown (top center)
2. Click **"Add Network"** → **"Add a network manually"**
3. **Enter these exact settings:**
   - **Network Name:** `Ganache Local`
   - **New RPC URL:** `http://127.0.0.1:7545`
   - **Chain ID:** `1337`
   - **Currency Symbol:** `ETH`
   - **Block Explorer URL:** (leave empty)
4. Click **"Save"**

### **6.3 Import Your Ganache Account**

1. **In MetaMask:** Click the account menu (top right) → **"Import Account"**
2. **Select Type:** "Private Key"
3. **Paste your private key** from Step 2.3 (starts with 0x)
4. Click **"Import"**
5. **Switch to Ganache network** using the network dropdown

**✅ Verification:**

- MetaMask shows **"Ganache Local"** network
- Your imported account shows **~100 ETH** balance
- Account address matches your Ganache account

---

## **Step 7: Start Database and Web Application**

### **7.1 Clean Any Existing Data (Optional)**

```bash
# Stop any running containers
docker-compose down

# Remove any existing data volumes (CAUTION: This deletes all data)
docker volume prune -f
```

### **7.2 Start Database Services**

```bash
# Start MySQL database and phpMyAdmin
docker-compose up -d mysql phpmyadmin

# Wait for database to be ready (about 30 seconds)
# Check database status
docker-compose logs mysql
```

### **7.3 Verify Database Connection**

1. **Access phpMyAdmin:**

   - Open: http://localhost:8080
   - **Username:** `certchain_user`
   - **Password:** `certchain_password`
   - **Server:** `mysql`

2. **Verify Database Exists:**
   - You should see `certchain` database
   - If not, the container is still initializing - wait longer

### **7.4 Setup Database Tables**

After the database is running, you need to create the required tables using the provided SQL script:

1. **Execute Database Setup Script:**

   - In phpMyAdmin (http://localhost:8080), click on the `certchain` database
   - Click the **"SQL"** tab at the top
   - Copy the contents of `scripts/database_setup.sql` and paste into the SQL query box
   - Click **"Go"** to execute the script

2. **Verify Tables Created:**
   - You should see tables: `users`, `certificates`, `activity_logs`, `user_sessions`
   - The script will show confirmation messages for successful setup

**Alternative method using command line:**

```bash
# Execute the SQL script directly
docker-compose exec mysql mysql -u certchain_user -pcertchain_password certchain < scripts/database_setup.sql
```

### **7.5 Start Web Application**

```bash
# Start the web application
docker-compose up -d webapp

# Check application logs
docker-compose logs webapp

# Wait for application to be ready (about 60 seconds)
```

### **7.6 Verify Application Status**

```bash
# Test application health
curl http://localhost:3000/api/health

# If successful, you should see health status response
```

**✅ Verification:**

- phpMyAdmin accessible at: http://localhost:8080
- Web application accessible at: http://localhost:3000
- Health endpoint responds: http://localhost:3000/api/health
- Database tables created successfully

---

## **Step 8: Deploy Smart Contract**

### **8.1 Compile Smart Contracts**

```bash
# Clean previous builds
npx hardhat clean

# Compile contracts
npx hardhat compile
```

### **8.2 Deploy Contract to Ganache**

```bash
# Deploy the smart contract
npx hardhat run scripts/deploy.js --network ganache
```

**The output should look like:**

```
Deploying CertificateNFT...
CertificateNFT deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Deployer Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Gas used: 2,234,567
Transaction hash: 0xabc123...
```

### **8.3 Update Contract Address in Configuration**

1. **Copy the contract address** from the deployment output
2. **Open `.env`** in a text editor
3. **Replace** `NEXT_PUBLIC_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000`
4. **With** `NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourActualContractAddress`
5. **Save the file**

Alternatively, use the update script:

```bash
# Use the automated script to update config files
node scripts/update-contract-address.js 0xYourActualContractAddress
```

### **8.4 Restart Application with New Configuration**

```bash
# Restart the web application to load new contract address
docker-compose restart webapp

# Wait for restart (about 30 seconds)
docker-compose logs webapp
```

**✅ Verification:**

- Contract successfully deployed to Ganache
  - `.env` contains the actual contract address
- Application restarted successfully

---

## **Step 9: Final Testing and Verification**

### **9.1 Test Complete System**

1. **Access Application:**

   - Open: http://localhost:3000
   - The page should load without errors

2. **Connect MetaMask:**

   - Click **"Connect Wallet"**
   - Select your imported Ganache account
   - Approve the connection

3. **Verify Role Assignment:**
   - You should see **"Admin"** role (first Ganache account gets admin automatically)
   - Dashboard should load successfully

### **9.2 Test Certificate Issuance**

1. **Go to Dashboard:** http://localhost:3000/dashboard
2. **Navigate to "Issue Certificate" tab**
3. **Fill out certificate details:**
   - Recipient Name: `Test User`
   - Recipient Email: `test@example.com`
   - Course/Title: `Test Certificate`
   - Description: `This is a test certificate`
4. **Click "Issue Certificate"**
5. **Confirm transaction in MetaMask**

### **9.3 Verify All Services**

**Check all access points:**

- ✅ **Web Application:** http://localhost:3000
- ✅ **Database Admin:** http://localhost:8080
- ✅ **Health Check:** http://localhost:3000/api/health
- ✅ **Storage Cleaner:** http://localhost:3000/clear-storage.html
- ✅ **IPFS Gateway:** http://127.0.0.1:8081
- ✅ **IPFS API:** http://127.0.0.1:5001

**Check external services:**

- ✅ **Ganache:** Should show transactions from certificate issuance
- ✅ **IPFS Desktop:** Should show new files added
- ✅ **MetaMask:** Should show transaction history

---

## 🛠️ **Manual Management Commands**

### **System Management**

```bash
# View application logs
docker-compose logs webapp

# View database logs
docker-compose logs mysql

# View all service logs
docker-compose logs

# Check service status
docker-compose ps

# Restart specific service
docker-compose restart webapp
docker-compose restart mysql

# Rebuild and restart containers (after code changes)
docker-compose up -d --build

# Stop all services
docker-compose down

# Start all services
docker-compose up -d
```

### **Database Management**

```bash
# Clean database completely (CAUTION: Deletes all data)
node scripts/clean-database.js

# Backup database
docker-compose exec mysql mysqldump -u certchain_user -pcertchain_password certchain > backup.sql

# Restore database
docker-compose exec -i mysql mysql -u certchain_user -pcertchain_password certchain < backup.sql
```

### **Smart Contract Management**

```bash
# Compile contracts only
npx hardhat compile

# Run contract tests
npx hardhat test

# Clean contract artifacts
npx hardhat clean

# Deploy new contract (after changes)
npx hardhat run scripts/deploy.js --network ganache

# Update configuration with new contract address
node scripts/update-contract-address.js 0xNewContractAddress
```

### **IPFS Management**

```bash
# Check IPFS node status
curl -X POST "http://127.0.0.1:5001/api/v0/id"

# List pinned files
curl -X POST "http://127.0.0.1:5001/api/v0/pin/ls"

# Check IPFS storage usage
curl -X POST "http://127.0.0.1:5001/api/v0/repo/stat"
```

---

## 🌐 **Access Points**

After successful manual setup, your CertChain system will be available at:

| Service             | URL                                      | Credentials                                            |
| ------------------- | ---------------------------------------- | ------------------------------------------------------ |
| **Web Application** | http://localhost:3000                    | Connect with MetaMask                                  |
| **Database Admin**  | http://localhost:8080                    | User: `certchain_user`, Password: `certchain_password` |
| **Health Check**    | http://localhost:3000/api/health         | Public endpoint                                        |
| **Storage Cleaner** | http://localhost:3000/clear-storage.html | Clear browser cache when needed                        |
| **IPFS Gateway**    | http://127.0.0.1:8081                    | Public IPFS gateway                                    |
| **IPFS Web UI**     | http://127.0.0.1:5001/webui              | IPFS node management interface                         |

---

## 🚨 **Troubleshooting Manual Setup**

### **Common Issues & Solutions**

| Issue                              | Symptoms                        | Manual Solution                                                                                             |
| ---------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Ganache not responding**         | Contract deployment fails       | Restart Ganache GUI, verify port 7545, check private key                                                    |
| **IPFS not connecting**            | Certificate uploads fail        | Restart IPFS Desktop, verify ports 5001/8081                                                                |
| **Docker containers not starting** | Services fail to start          | Check Docker Desktop is running, verify ports available, try rebuilding with `docker-compose up -d --build` |
| **Database connection errors**     | phpMyAdmin can't connect        | Wait 60 seconds for MySQL startup, check docker-compose logs mysql                                          |
| **Contract address not updating**  | Frontend shows old/zero address | Manually edit `.env`, restart webapp container                                                              |
| **MetaMask transaction failures**  | "Chain ID mismatch" errors      | Verify Ganache network added correctly, Chain ID = 1337                                                     |
| **Application health check fails** | API endpoints not responding    | Check webapp container logs, verify all services running                                                    |
| **Certificate images not loading** | Broken images in dashboard      | Verify IPFS Desktop running and connected, check gateway port 8081                                          |

### **Complete System Reset (Manual)**

If you need to start completely over:

```bash
# 1. Stop all Docker services
docker-compose down

# 2. Remove all data volumes (CAUTION: Deletes everything)
docker volume prune -f
docker system prune -f

# 3. Clean contract artifacts
npx hardhat clean

# 4. Restart external services
# - Restart Ganache GUI
# - Restart IPFS Desktop
# - Restart Docker Desktop

# 5. Begin setup from Step 7 again
```

### **Step-by-Step Debugging**

1. **Check Prerequisites:**

   ```bash
   # Verify all required software
   docker --version
   node --version
   curl -X POST "http://127.0.0.1:5001/api/v0/id"  # IPFS
   curl "http://127.0.0.1:7545"  # Ganache
   ```

2. **Check Docker Services:**

   ```bash
   docker-compose ps
   docker-compose logs
   ```

3. **Check Application Health:**

   ```bash
   curl http://localhost:3000/api/health
   ```

4. **Check Database Connection:**
   ```bash
   docker-compose exec mysql mysql -u certchain_user -pcertchain_password -e "SHOW DATABASES;"
   ```

---

## ✨ **Key Features**

### 🔐 **Blockchain-First Authentication**

- **MetaMask wallet** as the only authentication method
- **Smart contract roles** as single source of truth for permissions
- **Real-time role verification** with automatic updates
- **No passwords** - wallet address is your identity

### 📜 **ERC-721 NFT Certificate System**

- **ERC-721 NFT certificates** minted on blockchain with full standards compliance
- **Local IPFS storage** for decentralized document hosting and tamper-proof integrity
- **QR code verification** for instant validation
- **True ownership** - recipients own their certificates as NFTs

### 📊 **Comprehensive Activity Monitoring**

- **Real-time activity tracking** for all system events
- **Advanced filtering** by activity type with search interface
- **Blockchain transaction links** for complete transparency
- **Audit-ready logs** for compliance and monitoring

### 🎨 **Modern User Interface**

- **Responsive design** with Tailwind CSS and shadcn/ui components
- **Role-based dashboards** with unified interface for all user types
- **Real-time updates** and smooth user experience
- **Privacy-compliant** data access (users only see their own certificates)

### 🔒 **Enhanced Security & Privacy**

- **Wallet-isolated data** - users can only access their own certificates
- **Secure role-based permissions** enforced at both smart contract and application levels
- **Tamper-proof certificate integrity** through blockchain and IPFS
- **No central authority** - decentralized storage and verification

---

## 👥 **User Roles & Capabilities**

| Role         | Capabilities                                                     | Blockchain Permission | Dashboard Access                      |
| ------------ | ---------------------------------------------------------------- | --------------------- | ------------------------------------- |
| **ADMIN**    | Grant/revoke roles, system management, view all activities       | `ADMIN_ROLE`          | Full dashboard + activity monitoring  |
| **ISSUER**   | Issue certificates, manage own certificates, view own activities | `ISSUER_ROLE`         | Certificate management + own activity |
| **HOLDER**   | View owned certificates, download/share certificates             | Default (any wallet)  | Certificate viewing only              |
| **VERIFIER** | Verify certificates, read-only access to verification            | Public access         | Public verification page              |

**Important:** The first Ganache account automatically gets ADMIN role when you deploy the smart contract.

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
- **IPFS Desktop** - Decentralized file storage
- **Manual deployment** - Full control over each component

---

## 🧑‍💻 **Development Guide**

### **Development Workflow**

1. **Start External Services:**

   ```bash
   # Start IPFS Desktop (keep running)
   # Start Ganache GUI (keep running)
   # Ensure Docker Desktop is running
   ```

2. **Start Development Environment:**

   ```bash
   # Start database and web application
   docker-compose up -d mysql phpmyadmin webapp

   # Check logs to ensure everything started
   docker-compose logs
   ```

3. **Make Code Changes:**

   - Frontend: Edit files in `pages/`, `components/`, `styles/`
   - Smart Contracts: Edit files in `contracts/`
   - Database: Use phpMyAdmin at http://localhost:8080 or modify `scripts/database_setup.sql`

4. **Test Changes:**

   ```bash
   # For smart contract changes
   npx hardhat clean
   npx hardhat compile
   npx hardhat test
   npx hardhat run scripts/deploy.js --network ganache
   node scripts/update-contract-address.js 0xNewAddress
   docker-compose restart webapp
   ```

5. **Debug Issues:**

   ```bash
   # Check application health
   curl http://localhost:3000/api/health

   # View application logs
   docker-compose logs webapp

   # View database logs
   docker-compose logs mysql
   ```

### **Smart Contract Development**

```bash
# Clean and compile
npx hardhat clean
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Ganache
npx hardhat run scripts/deploy.js --network ganache

# Update configuration
node scripts/update-contract-address.js 0xContractAddress

# Restart application
docker-compose restart webapp
```

---

## 🌐 **API Reference**

### **System APIs**

- `GET /api/health` - System health status
- `GET /api/db-test` - Database connectivity test

### **Authentication APIs**

- `POST /api/auth/login` - Wallet-based authentication
- `GET /api/auth/verify-role` - Role verification

### **Certificate APIs**

- `POST /api/blockchain/issue-certificate` - Issue ERC-721 NFT certificate
- `GET /api/certificates/holder/[walletAddress]` - Get certificates for holder
- `GET /api/certificates/verify/[hash]` - Public certificate verification

### **Activity APIs**

- `GET /api/activity/get-logs` - Retrieve activity logs (with filtering)

---

## 🎯 **Production Deployment**

For production environments, update these configurations:

### **1. Environment Configuration**

Update your `.env` for production:

```env
# Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID=1  # Mainnet (or 5 for Goerli testnet)
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/YOUR-PROJECT-ID
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...your-deployed-contract

# Use secure, unique private keys
DEPLOYER_PRIVATE_KEY=0x...your-mainnet-deployer-key
SERVER_WALLET_PRIVATE_KEY=0x...your-server-wallet-key

# Production database
MYSQL_HOST=your-production-db-host
MYSQL_USER=your-db-user
MYSQL_PASSWORD=your-secure-password
MYSQL_DATABASE=certchain_prod

# Application Settings
NODE_ENV=production
```

### **2. IPFS Configuration for Production**

For production, consider:

- **IPFS Cluster** - Set up an IPFS cluster for redundancy
- **Pinning Services** - Use services like Pinata or Infura IPFS for reliable pinning
- **Custom IPFS Gateway** - Configure your own IPFS gateway for faster access

### **3. Security Checklist**

- ✅ Use environment variables for all secrets
- ✅ Enable HTTPS only (disable HTTP)
- ✅ Set up proper CORS policies
- ✅ Regular security audits of smart contracts
- ✅ Database access restrictions
- ✅ Rate limiting on API endpoints
- ✅ Secure IPFS node configuration
- ✅ Regular backups of certificate data

---

## 🤝 **Contributing**

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create your feature branch:** `git checkout -b feature/AmazingFeature`
3. **Test thoroughly:** Follow the manual setup guide to ensure everything works
4. **Commit your changes:** `git commit -m 'Add some AmazingFeature'`
5. **Push to the branch:** `git push origin feature/AmazingFeature`
6. **Open a Pull Request**

### **Development Standards**

- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation for any API changes
- Ensure manual setup guide still works
- Test with fresh database setup
- Verify IPFS integration works correctly

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
- [**IPFS**](https://ipfs.io/) - Decentralized file storage protocol

---

<div align="center">

**Built with ❤️ for the blockchain community**

🚀 **Ready to deploy manually?** Follow the complete setup guide above!

[![Manual Deploy](https://img.shields.io/badge/Deploy-Manually-success.svg)](.)
[![ERC721](https://img.shields.io/badge/Standard-ERC721-blue.svg)](.)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](.)

**🏆 Features**: ERC-721 NFT Certificates • Role-Based Access • Activity Monitoring • IPFS Storage • Manual Control

</div>
