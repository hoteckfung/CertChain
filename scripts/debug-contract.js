#!/usr/bin/env node

require("dotenv").config();
const { ethers } = require("ethers");

// Contract ABI for the functions we need
const CONTRACT_ABI = [
  "function isAdmin(address account) view returns (bool)",
  "function isIssuer(address account) view returns (bool)",
  "function getTotalCertificates() view returns (uint256)",
];

async function debugContract() {
  console.log("🔍 CertChain Contract Debug Information");
  console.log("=====================================\n");

  // Check environment variables
  console.log("📋 Environment Variables:");
  console.log(
    `NEXT_PUBLIC_CONTRACT_ADDRESS: ${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}`
  );
  console.log(`NEXT_PUBLIC_RPC_URL: ${process.env.NEXT_PUBLIC_RPC_URL}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID: ${process.env.NEXT_PUBLIC_CHAIN_ID}`);
  console.log(`DEPLOYER_ADDRESS: ${process.env.DEPLOYER_ADDRESS}`);
  console.log("");

  if (!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
    console.error("❌ NEXT_PUBLIC_CONTRACT_ADDRESS is not set!");
    return;
  }

  if (!process.env.NEXT_PUBLIC_RPC_URL) {
    console.error("❌ NEXT_PUBLIC_RPC_URL is not set!");
    return;
  }

  try {
    // Connect to the blockchain
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_RPC_URL
    );
    console.log("🔗 Connecting to blockchain...");

    // Check network connection
    const network = await provider.getNetwork();
    console.log(
      `✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`
    );

    // Check if contract exists
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const code = await provider.getCode(contractAddress);

    if (code === "0x") {
      console.error(`❌ No contract found at address: ${contractAddress}`);
      console.log("   This could mean:");
      console.log("   1. The contract was not deployed");
      console.log("   2. The contract address is incorrect");
      console.log("   3. You're connected to the wrong network");
      return;
    }

    console.log(`✅ Contract found at: ${contractAddress}`);

    // Create contract instance
    const contract = new ethers.Contract(
      contractAddress,
      CONTRACT_ABI,
      provider
    );

    // Check contract status
    console.log("\n📊 Contract Status:");
    try {
      const totalCerts = await contract.getTotalCertificates();
      console.log(`Total certificates: ${totalCerts.toString()}`);
    } catch (error) {
      console.error(`❌ Error checking contract status: ${error.message}`);
    }

    // Check deployer admin role
    if (process.env.DEPLOYER_ADDRESS) {
      console.log("\n👤 Role Check:");
      try {
        const deployerAddress = process.env.DEPLOYER_ADDRESS;
        console.log(`Checking roles for: ${deployerAddress}`);

        const isAdmin = await contract.isAdmin(deployerAddress);
        const isIssuer = await contract.isIssuer(deployerAddress);

        console.log(`Is Admin: ${isAdmin ? "✅ YES" : "❌ NO"}`);
        console.log(`Is Issuer: ${isIssuer ? "✅ YES" : "❌ NO"}`);

        if (!isAdmin) {
          console.log(
            "\n⚠️  WARNING: Deployer address does not have admin role!"
          );
          console.log(
            "   This is why you're seeing the Holder Dashboard instead of Admin Dashboard."
          );
          console.log(
            "   You need to grant admin role to your deployer address."
          );
        }
      } catch (error) {
        console.error(`❌ Error checking roles: ${error.message}`);
      }
    } else {
      console.log("\n❌ DEPLOYER_ADDRESS not set - cannot check roles");
    }

    console.log("\n🔧 Recommendations:");
    console.log("1. Make sure Ganache is running on the correct port");
    console.log("2. Verify the contract address matches the deployed contract");
    console.log(
      "3. Ensure your deployer address has admin role in the contract"
    );
    console.log(
      "4. Check that you're using the same network in MetaMask and the app"
    );
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);

    if (error.code === "NETWORK_ERROR") {
      console.log("   This could mean:");
      console.log("   1. Ganache is not running");
      console.log("   2. Wrong RPC URL");
      console.log("   3. Network connectivity issues");
    }
  }
}

debugContract().catch(console.error);
