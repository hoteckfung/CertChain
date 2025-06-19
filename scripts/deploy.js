const hre = require("hardhat");

async function main() {
  console.log("🚀 CertChain Smart Contract Deployment");
  console.log("=====================================");
  console.log("");

  try {
    console.log("📋 Starting deployment of CertificateNFT contract...");
    console.log(`🌐 Network: ${hre.network.name}`);
    console.log(`⛽ Chain ID: ${hre.network.config.chainId || "Unknown"}`);
    console.log("");

    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    const balance = await hre.ethers.provider.getBalance(deployerAddress);

    console.log("👤 Deployer Information:");
    console.log(`   Address: ${deployerAddress}`);
    console.log(`   Balance: ${hre.ethers.formatEther(balance)} ETH`);

    // Check if deployer has enough balance
    const minBalance = hre.ethers.parseEther("0.01"); // 0.01 ETH minimum
    if (balance < minBalance) {
      console.log("⚠️  Warning: Low deployer balance. Deployment may fail.");
    }
    console.log("");

    // Get the contract factory
    console.log("🔨 Compiling and preparing contract...");
    const CertificateNFT = await hre.ethers.getContractFactory(
      "CertificateNFT"
    );
    console.log("✅ Contract factory created");

    // Deploy the contract
    console.log("🚀 Deploying CertificateNFT contract...");
    const certificateNFT = await CertificateNFT.deploy();

    console.log("⏳ Waiting for deployment confirmation...");
    await certificateNFT.waitForDeployment();

    const contractAddress = await certificateNFT.getAddress();
    console.log("✅ Contract deployed successfully!");
    console.log(`📍 Contract Address: ${contractAddress}`);
    console.log("");

    // Get deployment transaction details
    const deploymentTx = certificateNFT.deploymentTransaction();
    if (deploymentTx) {
      console.log("📄 Transaction Details:");
      console.log(`   Hash: ${deploymentTx.hash}`);
      console.log(
        `   Gas Used: ${deploymentTx.gasLimit?.toString() || "Unknown"}`
      );
      console.log(
        `   Gas Price: ${
          deploymentTx.gasPrice
            ? hre.ethers.formatUnits(deploymentTx.gasPrice, "gwei") + " gwei"
            : "Unknown"
        }`
      );
      console.log("");
    }

    // Verify roles are set up correctly
    console.log("🔐 Verifying role assignments...");
    try {
      const hasAdminRole = await certificateNFT.isAdmin(deployerAddress);
      const hasIssuerRole = await certificateNFT.isIssuer(deployerAddress);

      console.log("✅ Role Verification:");
      console.log(
        `   Deployer has ADMIN role: ${hasAdminRole ? "✅ Yes" : "❌ No"}`
      );
      console.log(
        `   Deployer has ISSUER role: ${hasIssuerRole ? "✅ Yes" : "❌ No"}`
      );

      if (!hasAdminRole) {
        console.log(
          "⚠️  Warning: Deployer does not have admin role! This may cause issues."
        );
      }
    } catch (error) {
      console.log("⚠️  Could not verify roles:", error.message);
    }
    console.log("");

    // Get current block information
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    const block = await hre.ethers.provider.getBlock(blockNumber);

    // Create comprehensive deployment info
    const deploymentInfo = {
      network: hre.network.name,
      chainId: hre.network.config.chainId,
      contractAddress: contractAddress,
      deployer: deployerAddress,
      deploymentTime: new Date().toISOString(),
      blockNumber: blockNumber,
      blockTimestamp: block
        ? new Date(block.timestamp * 1000).toISOString()
        : null,
      transactionHash: deploymentTx?.hash || null,
      gasUsed: deploymentTx?.gasLimit?.toString() || null,
    };

    console.log("📊 Deployment Summary:");
    console.log("======================");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    console.log("");

    // Provide next steps
    console.log("🎯 Next Steps:");
    console.log("==============");
    console.log("1. 📝 Update your application configuration:");
    console.log(
      `   node scripts/update-contract-address.js ${contractAddress}`
    );
    console.log("");
    console.log("2. 🔄 Restart your Docker containers:");
    console.log("   docker-compose restart webapp");
    console.log("");
    console.log("3. 🌐 Visit your application:");
    console.log("   http://localhost:3000");
    console.log("");
    console.log("4. 🦊 Connect your deployer wallet in MetaMask:");
    console.log(`   Address: ${deployerAddress}`);
    console.log("   (This wallet will have admin privileges)");
    console.log("");

    // Check if .env.local needs updating
    try {
      const fs = require("fs");
      const path = require("path");
      const envPath = path.join(process.cwd(), ".env.local");

      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf8");
        if (!envContent.includes(contractAddress)) {
          console.log(
            "⚠️  Your .env.local file needs to be updated with the new contract address."
          );
          console.log(
            "   Run the update command above to do this automatically."
          );
        } else {
          console.log(
            "✅ Your .env.local already contains this contract address."
          );
        }
      } else {
        console.log(
          "⚠️  .env.local file not found. Make sure to create it with the contract address."
        );
      }
    } catch (error) {
      console.log("⚠️  Could not check .env.local file:", error.message);
    }

    console.log("");
    console.log("🎉 Deployment completed successfully!");
    console.log("=====================================");

    return certificateNFT;
  } catch (error) {
    console.error("");
    console.error("❌ DEPLOYMENT FAILED!");
    console.error("=====================");
    console.error("Error:", error.message);
    console.error("");
    console.error("🔧 Troubleshooting:");
    console.error("- Ensure Ganache GUI is running on http://127.0.0.1:7545");
    console.error("- Check that DEPLOYER_PRIVATE_KEY is set in .env.local");
    console.error("- Verify the deployer account has sufficient ETH balance");
    console.error(
      "- Make sure the network configuration in hardhat.config.js is correct"
    );
    console.error("");
    throw error;
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error.message);
      process.exit(1);
    });
}

module.exports = { main };
