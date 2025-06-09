# 🚀 Quick Start Guide - CertChain with Ganache

## 📋 **Essential Commands Reference**

### **1. Deploy Smart Contract to Ganache**

```bash
npx hardhat run scripts/deploy.js --network ganache
```

### **2. Test Smart Contract**

```bash
npx hardhat test
```

### **3. Start Development Server**

```bash
npm run dev
```

### **4. Build Application**

```bash
npm run build
```

## ⚙️ **Setup Checklist**

### **Prerequisites**

- [ ] Ganache installed and running on port 7545
- [ ] MetaMask installed in browser
- [ ] Node.js and npm installed

### **Environment Setup**

- [ ] `.env.local` configured with Ganache settings
- [ ] `.env` file created with Ganache private key
- [ ] Contract deployed and address updated in `.env.local`

### **MetaMask Configuration**

- [ ] Custom network added: Ganache (RPC: http://127.0.0.1:7545, Chain ID: 1337)
- [ ] Ganache account imported using private key
- [ ] Connected to Ganache network

## 🔧 **Complete Setup Process**

### **Step 1: Start Ganache**

1. Open Ganache application
2. Create new workspace or use quickstart
3. Ensure it's running on port 7545
4. Copy the first account's private key

### **Step 2: Configure Environment**

Create `.env` file in project root:

```env
PRIVATE_KEY=0x_your_ganache_first_account_private_key_here
```

Your `.env.local` should already have:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x85C553D13BdD2213910043E387072AC412c33653
NEXT_PUBLIC_CHAIN_ID=1337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:7545
```

### **Step 3: Deploy Contract**

```bash
npx hardhat run scripts/deploy.js --network ganache
```

**Important**: After deployment, update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local` with the new contract address.

### **Step 4: Configure MetaMask**

1. Add custom network:

   - **Network Name**: Ganache
   - **RPC URL**: http://127.0.0.1:7545
   - **Chain ID**: 1337
   - **Currency Symbol**: ETH

2. Import Ganache account:
   - Use the private key from Step 1
   - This account will have admin/issuer privileges

### **Step 5: Start Application**

```bash
npm run dev
```

Visit http://localhost:3000

## 🎯 **Key File Locations**

```
📁 Your Project
├── 📄 .env                  # Ganache private key (for deployment)
├── 📄 .env.local           # Frontend blockchain config
├── 📁 contracts/
│   └── 📄 CertificateNFT.sol
├── 📁 scripts/
│   └── 📄 deploy.js        # Deployment script
├── 📁 pages/
│   └── 📄 issuer.js        # Main issuer dashboard
└── 📁 utils/
    └── 📄 contract.js      # Blockchain utilities
```

## 🔄 **Common Workflows**

### **Redeploy Contract (if needed)**

```bash
# 1. Deploy new contract
npx hardhat run scripts/deploy.js --network ganache

# 2. Copy new contract address from output
# 3. Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local
# 4. Restart development server
npm run dev
```

### **Issue a Certificate**

1. Go to http://localhost:3000/issuer
2. Connect MetaMask wallet
3. Upload certificate file to IPFS
4. Fill recipient details
5. Click "Issue Certificate"
6. Confirm transaction in MetaMask

### **Verify a Certificate**

1. Go to http://localhost:3000/verify
2. Enter Token ID or IPFS hash
3. View verification results

## 🛠️ **Troubleshooting**

### **🔧 Quick Diagnosis Tool**

Run this command to diagnose common issues:

```bash
node scripts/test-connection.js
```

### **🎯 Quick Fix for "missing revert data" Error**

If you get the error, you need to use the correct MetaMask account:

1. **Import Ganache Account to MetaMask:**

   - In Ganache, copy the private key of the first account
   - In MetaMask: Account menu → Import Account → Paste private key
   - This account has admin/issuer permissions

2. **OR Grant Role to Your Current Account:**
   ```bash
   # Replace 0x123... with your MetaMask account address
   node scripts/grant-issuer-role.js 0x123...
   ```

### **Common Error: "missing revert data"**

This error usually means:

1. **Account doesn't have ISSUER role** (most common)
2. **Contract is paused**
3. **Ganache not running**
4. **Wrong network connected**

**Solutions:**

```bash
# 1. Check if Ganache is running and deploy contract
npx hardhat run scripts/deploy.js --network ganache

# 2. Run diagnosis tool
node scripts/test-connection.js

# 3. Copy new contract address to .env.local
# Update NEXT_PUBLIC_CONTRACT_ADDRESS with the deployed address
```

### **MetaMask Connection Issues**

- Switch to Ganache network in MetaMask
- Ensure Chain ID is 1337
- Check RPC URL is http://127.0.0.1:7545
- Import Ganache account using private key from Ganache

### **Transaction Failures**

- Ensure Ganache account has ETH (should have 100 ETH by default)
- Check if wallet is connected to the correct network
- Verify contract address matches deployed contract
- Make sure you're using the same account that deployed the contract

### **Contract Not Found**

```bash
# Redeploy the contract
npx hardhat run scripts/deploy.js --network ganache

# Copy the new contract address
# Update .env.local with new address
# Restart development server
npm run dev
```

### **Network Mismatch**

- Expected: Chain ID 1337 (Ganache)
- Check MetaMask network settings
- Ensure Ganache is running on port 7545

### **Insufficient Permissions**

The deployer account automatically gets admin/issuer roles. Make sure you're using:

- The same account that deployed the contract
- Or grant issuer role to your current account using admin functions

## 📚 **Important Notes**

### **Network Configuration**

- **Ganache**: Local development (Chain ID: 1337, Port: 7545)
- **Hardhat**: Alternative local (Chain ID: 31337, Port: 8545)
- **Sepolia**: Testnet deployment (Chain ID: 11155111)

### **Account Management**

- First Ganache account = Contract deployer/admin
- Other accounts = Certificate recipients for testing
- Private keys are visible in Ganache (for development only)

### **Data Persistence**

- Ganache data persists between sessions
- Contract state maintained on blockchain
- IPFS files stored permanently

## 🎉 **You're Ready!**

Your blockchain certificate system is now configured with Ganache. All certificates issued will be real NFTs on your local blockchain that recipients can own, transfer, and verify anywhere!
