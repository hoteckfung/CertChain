# 🏆 CertChain - Blockchain Certificate Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![Blockchain](https://img.shields.io/badge/Blockchain-Ethereum-purple.svg)](https://ethereum.org)

A modern, **blockchain-first certificate issuance and verification platform** built with Next.js, Smart Contracts, and MySQL. Issue tamper-proof NFT certificates with secure role-based access control and comprehensive activity monitoring.

---

## 🚀 **Quick Start - Choose Your Path**

### 🎯 **For First-Time Users (Recommended)**

**Interactive guided setup with automatic prerequisites checking:**

```bash
# Windows
scripts\deploy.bat --setup

# Linux/Mac
chmod +x scripts/deploy.sh
./scripts/deploy.sh --setup
```

### ⚡ **For Experienced Users**

**Standard deployment (requires manual prerequisite setup):**

```bash
# Windows
scripts\deploy.bat

# Linux/Mac
./scripts/deploy.sh
```

### 🔄 **For Complete Fresh Start**

**Clean everything and redeploy (automated):**

```bash
# Windows
scripts\deploy.bat --fresh

# Linux/Mac
./scripts/deploy.sh --fresh
```

---

## 📋 **Prerequisites**

Before starting, ensure you have these installed:

- ✅ **Docker Desktop** - [Download here](https://docker.com/products/docker-desktop)
- ✅ **Node.js (v16+)** - [Download here](https://nodejs.org)
- ✅ **Git** - [Download here](https://git-scm.com)
- ✅ **MetaMask Browser Extension** - [Install here](https://metamask.io)
- ✅ **Ganache GUI** - [Download here](https://trufflesuite.com/ganache/)
- ✅ **IPFS Desktop** - [Download here](https://desktop.ipfs.io/) **(Required for certificate storage)**

**💡 Pro Tip:** Use `scripts\deploy.bat --verify` (Windows) or `./scripts/deploy.sh --verify` (Linux/Mac) to check all prerequisites automatically!

---

## 🎯 **Complete Setup Guide**

Follow this step-by-step guide to get CertChain running from scratch:

### **Step 1: Clone Repository & Setup**

```bash
# Clone the repository
git clone https://github.com/your-username/CertChain.git
cd CertChain

# Check prerequisites automatically
# Windows:
scripts\deploy.bat --verify

# Linux/Mac:
chmod +x scripts/deploy.sh
./scripts/deploy.sh --verify
```

**What this does:** Automatically checks Docker, Node.js, NPM packages, and MetaMask requirements.

### **Step 2: Setup IPFS Desktop**

**📁 IPFS is required for decentralized certificate storage:**

1. **Download and Install IPFS Desktop:**

   - Visit: https://desktop.ipfs.io/
   - Download for your platform (Windows, macOS, or Linux)
   - Install and run the application

2. **Start IPFS Node:**

   - Open IPFS Desktop
   - The node will start automatically (you'll see a green "Connected" status)
   - IPFS API will be available at: `http://127.0.0.1:5001`
   - IPFS Gateway will be available at: `http://127.0.0.1:8080`

3. **Resolve Port Conflict (Important):**

   - **Port 8080 conflict:** phpMyAdmin (database admin) also uses port 8080
   - In IPFS Desktop: Go to **Settings** → **IPFS Config**
   - Find the `"Gateway"` section and change port from `8080` to `8081`:
     ```json
     "Gateway": {
       "HTTPHeaders": {},
       "RootRedirect": "",
       "Writable": false,
       "PathPrefixes": [],
       "APICommands": [],
       "NoFetch": false,
       "NoDNSLink": false,
       "PublicGateways": null
     },
     "Addresses": {
       "Gateway": "/ip4/127.0.0.1/tcp/8081"
     }
     ```
   - Click **Save** and restart IPFS Desktop
   - IPFS Gateway will now be available at: `http://127.0.0.1:8081`

4. **Verify IPFS is Running:**
   - Check that the IPFS Desktop shows "Connected" status
   - Visit `http://127.0.0.1:5001/webui` for the IPFS web interface
   - Verify gateway access at `http://127.0.0.1:8081`

**💡 Important:** Keep IPFS Desktop running whenever using CertChain. Certificates are stored on IPFS for decentralized, tamper-proof storage.

### **Step 3: Start Interactive Setup**

```bash
# Windows:
scripts\deploy.bat --setup

# Linux/Mac:
./scripts/deploy.sh --setup
```

**What this does:**

- ✅ Verifies all prerequisites are installed
- ✅ Creates `.env.local` configuration file automatically
- ✅ Starts Docker services (MySQL database + web application)
- ✅ Checks for Ganache and IPFS connections
- ✅ Provides clear next steps

**After this step, you'll have:**

- 🌐 Web app running at: http://localhost:3000
- 🗄️ Database admin at: http://localhost:8080
- 📝 Environment file created with templates

### **Step 4: Setup Ganache Blockchain**

1. **Download and Install Ganache GUI:**

   - Visit: https://trufflesuite.com/ganache/
   - Download and install for your platform

2. **Start Ganache:**

   - Open Ganache GUI
   - Click **"QUICKSTART"** (recommended - auto-configures everything)
   - Verify settings:
     - RPC Server: `HTTP://127.0.0.1:7545`
     - Chain ID: `1337`

3. **Get Your Private Key:**
   - In Ganache GUI: Click the 🔑 icon next to the first account
   - Copy the private key (starts with `0x`)

### **Step 5: Configure Your Environment Keys**

**🔑 Setting up your own wallet keys in `.env.local`:**

The setup script creates a `.env.local` file with placeholder values. **You MUST update it with your own keys:**

```env
# MySQL Configuration (for local development)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=mysql
MYSQL_DATABASE=certchain

# MySQL Configuration (for Docker - will override above when using Docker)
# MYSQL_HOST=mysql

# Blockchain Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...will-be-set-after-deployment
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:7545
NEXT_PUBLIC_CHAIN_ID=1337

# Deployer Configuration - REPLACE WITH YOUR GANACHE KEYS
DEPLOYER_ADDRESS=0xYourGanacheAccountAddress
DEPLOYER_PRIVATE_KEY=0xYourGanachePrivateKeyFromStep4

# Server Wallet (for server-side blockchain interactions)
# Usually the same as deployer for local development
SERVER_WALLET_PRIVATE_KEY=0xYourGanachePrivateKeyFromStep4

# Application Settings
NODE_ENV=development
```

**📝 How to update your keys:**

1. **DEPLOYER_ADDRESS**: Copy the public address of your first Ganache account
2. **DEPLOYER_PRIVATE_KEY**: Paste the private key you copied in Step 4
3. **SERVER_WALLET_PRIVATE_KEY**: Use the same private key for local development

**💡 Important:**

- The first Ganache account automatically gets admin privileges!
- Never commit real private keys to version control
- For production, use environment variables or secure key management

### **Step 6: Deploy Smart Contract & Complete Setup**

Choose one of these options:

#### **Option A: Automated Fresh Deployment (Recommended)**

```bash
# Windows:
scripts\deploy.bat --fresh

# Linux/Mac:
./scripts/deploy.sh --fresh
```

**What this does automatically:**

- 🧹 Cleans database completely
- 🚀 Compiles and deploys smart contract to Ganache
- 🔄 Updates configuration files with contract address
- 🔄 Restarts services with new configuration

#### **Option B: Manual Deployment**

```bash
# 1. Compile smart contract
npx hardhat compile

# 2. Deploy to Ganache
npx hardhat run scripts/deploy.js --network ganache

# 3. Copy the contract address from output, then update config
node scripts/update-contract-address.js 0xYourContractAddress

# 4. Restart services
# Windows: scripts\deploy.bat --stop && scripts\deploy.bat
# Linux/Mac: ./scripts/deploy.sh --stop && ./scripts/deploy.sh
```

### **Step 7: Setup MetaMask**

1. **Add Ganache Network to MetaMask:**

   - Open MetaMask → Networks dropdown → "Add Network" → "Add a network manually"
   - **Network Name:** `Ganache Local`
   - **RPC URL:** `http://127.0.0.1:7545`
   - **Chain ID:** `1337`
   - **Currency Symbol:** `ETH`
   - Click "Save"

2. **Import Your Ganache Account:**
   - In MetaMask: Account menu → "Import Account"
   - Paste your Ganache private key (from Step 4)
   - Click "Import"

### **Step 8: Test Your Installation**

1. **Visit the Application:**

   - Go to: http://localhost:3000
   - Click "Connect Wallet" and select your imported Ganache account
   - You should see your role detected (Admin for first account)

2. **Test Certificate Issuance:**

   - Visit: http://localhost:3000/dashboard
   - Go to "Issue Certificate" tab
   - Fill in recipient details and issue a test certificate
   - Confirm the MetaMask transaction

3. **Verify System Health:**

   ```bash
   # Windows:
   scripts\deploy.bat --health

   # Linux/Mac:
   ./scripts/deploy.sh --health
   ```

---

## 🛠️ **Management Commands**

### **System Management**

```bash
# Show comprehensive help
scripts\deploy.bat --help          # Windows
./scripts/deploy.sh --help         # Linux/Mac

# Check application health
scripts\deploy.bat --health        # Windows
./scripts/deploy.sh --health       # Linux/Mac

# View real-time logs
scripts\deploy.bat --logs          # Windows
./scripts/deploy.sh --logs         # Linux/Mac

# Stop all services
scripts\deploy.bat --stop          # Windows
./scripts/deploy.sh --stop         # Linux/Mac
```

### **Database Management**

```bash
# Clean database only (keeps smart contract)
scripts\deploy.bat --clean         # Windows
./scripts/deploy.sh --clean        # Linux/Mac

# Complete fresh start (clean DB + new contract)
scripts\deploy.bat --fresh         # Windows
./scripts/deploy.sh --fresh        # Linux/Mac
```

### **Development Commands**

```bash
# Check prerequisites
scripts\deploy.bat --verify        # Windows
./scripts/deploy.sh --verify       # Linux/Mac

# Interactive guided setup
scripts\deploy.bat --setup         # Windows
./scripts/deploy.sh --setup        # Linux/Mac
```

---

## 🌐 **Access Points**

After successful deployment, your CertChain system will be available at:

| Service             | URL                                      | Description                                                         |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| **Web Application** | http://localhost:3000                    | Main CertChain interface                                            |
| **Database Admin**  | http://localhost:8080                    | phpMyAdmin (user: `certchain_user`, password: `certchain_password`) |
| **Health Check**    | http://localhost:3000/api/health         | System status endpoint                                              |
| **Storage Cleaner** | http://localhost:3000/clear-storage.html | Clear browser cache                                                 |
| **IPFS Gateway**    | http://127.0.0.1:8081                    | IPFS local gateway for file access (port changed to avoid conflict) |
| **IPFS API**        | http://127.0.0.1:5001                    | IPFS HTTP API endpoint                                              |

---

## 🚨 **Troubleshooting**

### **Quick Diagnostics**

```bash
# Check if everything is working
# Windows:
scripts\deploy.bat --health

# Linux/Mac:
./scripts/deploy.sh --health
```

### **Common Issues & Solutions**

| Issue                              | Symptoms                    | Solution                                           |
| ---------------------------------- | --------------------------- | -------------------------------------------------- |
| **"DEPLOYER_PRIVATE_KEY not set"** | Contract deployment fails   | Add private key from Ganache to `.env.local`       |
| **"Cannot connect to Ganache"**    | Blockchain connection fails | Start Ganache GUI on port 7545                     |
| **"IPFS node not running"**        | Certificate storage fails   | Start IPFS Desktop and ensure it's connected       |
| **"Port 3000 already in use"**     | Application won't start     | Stop existing process or use `--stop` then restart |
| **"Database connection failed"**   | MySQL errors                | Wait 30 seconds for MySQL startup, check Docker    |
| **MetaMask "Chain ID mismatch"**   | Transaction failures        | Add Ganache network (Chain ID: 1337) to MetaMask   |
| **"missing revert data"**          | Certificate issuance fails  | Use admin account or grant ISSUER role             |
| **"Failed to upload to IPFS"**     | Certificate creation fails  | Verify IPFS Desktop is running and connected       |

### **IPFS-Specific Troubleshooting**

| Issue                              | Symptoms                   | Solution                                      |
| ---------------------------------- | -------------------------- | --------------------------------------------- |
| **IPFS Desktop not connecting**    | Red status or offline      | Restart IPFS Desktop, check firewall settings |
| **IPFS API errors**                | Upload failures            | Verify `http://127.0.0.1:5001` is accessible  |
| **Certificate images not loading** | Broken images in dashboard | Check IPFS node status, restart if needed     |

### **Reset Everything**

If you encounter persistent issues:

```bash
# Stop everything
# Windows: scripts\deploy.bat --stop
# Linux/Mac: ./scripts/deploy.sh --stop

# Complete fresh start
# Windows: scripts\deploy.bat --fresh
# Linux/Mac: ./scripts/deploy.sh --fresh
```

### **View Logs for Debugging**

```bash
# Real-time application logs
# Windows: scripts\deploy.bat --logs
# Linux/Mac: ./scripts/deploy.sh --logs

# Specific service logs
docker-compose logs webapp          # Web application
docker-compose logs mysql           # Database
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
- **Health monitoring** - Built-in system diagnostics

---

## 🧑‍💻 **Development Guide**

### **Development Workflow**

1. **Start Development Environment:**

   ```bash
   # Start IPFS Desktop (keep running)
   # Start Ganache GUI (keep running)
   # Run setup
   # Windows: scripts\deploy.bat --setup
   # Linux/Mac: ./scripts/deploy.sh --setup
   ```

2. **Make Code Changes:**

   - Frontend: Edit files in `pages/`, `components/`, `styles/`
   - Smart Contracts: Edit files in `contracts/`
   - Database: Use phpMyAdmin at http://localhost:8080

3. **Test Changes:**

   ```bash
   # For smart contract changes
   npx hardhat test
   npx hardhat run scripts/deploy.js --network ganache
   node scripts/update-contract-address.js 0xNewAddress
   ```

4. **Debug Issues:**

   ```bash
   # Check system health
   # Windows: scripts\deploy.bat --health
   # Linux/Mac: ./scripts/deploy.sh --health

   # View logs
   # Windows: scripts\deploy.bat --logs
   # Linux/Mac: ./scripts/deploy.sh --logs
   ```

### **Smart Contract Development**

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Ganache
npx hardhat run scripts/deploy.js --network ganache

# Clean build artifacts
npx hardhat clean
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

Update your `.env.local` for production:

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
3. **Test thoroughly:** Use the deployment scripts to ensure everything works
4. **Commit your changes:** `git commit -m 'Add some AmazingFeature'`
5. **Push to the branch:** `git push origin feature/AmazingFeature`
6. **Open a Pull Request**

### **Development Standards**

- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation for any API changes
- Ensure deployment scripts still work
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

🚀 **Ready to deploy?** Run the setup command and get started in 15 minutes!

```bash
# Windows
scripts\deploy.bat --setup

# Linux/Mac
./scripts/deploy.sh --setup
```

[![Deploy](https://img.shields.io/badge/Deploy-Now-success.svg)](.)
[![ERC721](https://img.shields.io/badge/Standard-ERC721-blue.svg)](.)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](.)

**🏆 Features**: ERC-721 NFT Certificates • Role-Based Access • Activity Monitoring • IPFS Storage • Docker Ready

</div>
