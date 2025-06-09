# Scripts Directory

This directory contains utility scripts and SQL files for managing the CertChain blockchain certificate system.

## 📁 Database Setup Scripts

### SQL Files

- **`create-activity-table.sql`** - Creates the activity_logs table with sample data for comprehensive activity tracking
- **`create_holder_profiles_table.sql`** - Creates the holder_profiles table for storing user profile information

### Database Management

- **`setup-database.js`** - Comprehensive database setup script that executes the main schema and verifies installation
- **`test-db-connection.js`** - Tests MySQL database connectivity and shows database status

## 🔗 Blockchain Scripts

### Smart Contract Deployment

- **`deploy.js`** - Deploys the CertificateNFT smart contract to the specified network (Ganache/Hardhat)
- **`grant-issuer-role.js`** - Grants ISSUER role to specific wallet addresses on the deployed contract

### Blockchain Testing

- **`test-connection.js`** - Comprehensive blockchain connectivity test including:
  - RPC connection verification
  - Contract deployment status
  - Contract function testing
  - Account balance and role verification

## 🚀 Usage Instructions

### Initial Setup (Run Once)

```bash
# 1. Set up database schema
node scripts/setup-database.js

# 2. Deploy smart contract (make sure Ganache is running)
npx hardhat run scripts/deploy.js --network ganache

# 3. Grant issuer role to your MetaMask account
node scripts/grant-issuer-role.js
```

### Development Testing

```bash
# Test database connectivity
node scripts/test-db-connection.js

# Test blockchain connectivity
node scripts/test-connection.js
```

### Database Updates

```bash
# Create activity logs table (if not exists)
mysql -u root -p certchain < scripts/create-activity-table.sql

# Create holder profiles table (if not exists)
mysql -u root -p certchain < scripts/create_holder_profiles_table.sql
```

## 📋 Script Dependencies

### Environment Variables Required

- **Database Scripts**: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
- **Blockchain Scripts**: `NEXT_PUBLIC_CONTRACT_ADDRESS`, `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_RPC_URL`

### Prerequisites

- Node.js with ES modules support
- MySQL server running
- Ganache or Hardhat network for blockchain scripts
- MetaMask browser extension for role management

## 🔧 Troubleshooting

### Database Issues

- Ensure MySQL server is running on the correct port
- Verify credentials in `.env.local` file
- Check if database `certchain` exists

### Blockchain Issues

- Ensure Ganache is running on specified RPC URL
- Verify contract is deployed to the correct address
- Check if wallet has sufficient balance for transactions

### Role Permission Issues

- Run `grant-issuer-role.js` to grant blockchain roles
- Verify the deployer account has admin privileges
- Check contract is not paused
