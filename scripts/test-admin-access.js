#!/usr/bin/env node

require("dotenv").config();
const { ethers } = require("ethers");

// Contract ABI for testing
const CONTRACT_ABI = [
  "function isAdmin(address account) view returns (bool)",
  "function isIssuer(address account) view returns (bool)",
];

async function testAdminAccess() {
  console.log("🧪 Testing Admin Access for CertChain");
  console.log("===================================\n");

  const deployerAddress = process.env.DEPLOYER_ADDRESS;
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  const serverRpcUrl = process.env.SERVER_RPC_URL;

  console.log("📋 Environment Configuration:");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Client RPC URL: ${rpcUrl}`);
  console.log(
    `Server RPC URL: ${serverRpcUrl || "Not set (will use client URL)"}`
  );
  console.log(`Deployer Address: ${deployerAddress}`);
  console.log(`Node Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("");

  if (!deployerAddress || !contractAddress || !rpcUrl) {
    console.error("❌ Missing required environment variables");
    console.log("Make sure the following are set in your .env file:");
    console.log("- NEXT_PUBLIC_CONTRACT_ADDRESS");
    console.log("- NEXT_PUBLIC_RPC_URL");
    console.log("- DEPLOYER_ADDRESS");
    return;
  }

  try {
    // Test both client and server RPC URLs
    const testUrls = [{ name: "Client RPC", url: rpcUrl }];

    if (serverRpcUrl && serverRpcUrl !== rpcUrl) {
      testUrls.push({ name: "Server RPC", url: serverRpcUrl });
    }

    for (const { name, url } of testUrls) {
      console.log(`🔗 Testing ${name} (${url})...`);

      try {
        // Create provider with ENS disabled for local networks
        const provider = new ethers.JsonRpcProvider(url, {
          chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID) || 31337,
          name: "ganache",
          ensAddress: null,
        });

        const network = await provider.getNetwork();
        console.log(`✅ Connected to ${name}: Chain ID ${network.chainId}`);

        // Check contract exists
        const code = await provider.getCode(contractAddress);
        if (code === "0x") {
          console.log(`❌ No contract found at ${contractAddress} on ${name}`);
          continue;
        }
        console.log(`✅ Contract found on ${name}`);

        // Test admin role
        const contract = new ethers.Contract(
          contractAddress,
          CONTRACT_ABI,
          provider
        );
        const isAdmin = await contract.isAdmin(deployerAddress);
        const isIssuer = await contract.isIssuer(deployerAddress);

        console.log(`📊 ${name} Role Results:`);
        console.log(`   Admin: ${isAdmin ? "✅ YES" : "❌ NO"}`);
        console.log(`   Issuer: ${isIssuer ? "✅ YES" : "❌ NO"}`);
      } catch (error) {
        console.log(`❌ ${name} failed:`, error.message);
      }
      console.log("");
    }

    console.log("🚀 Troubleshooting Steps:");
    console.log("");

    console.log("1. 🧹 Clear Browser Cache:");
    console.log("   - Visit: http://localhost:3000/clear-storage.html");
    console.log("   - Click 'Clear ALL Storage'");
    console.log("   - This removes cached authentication data");
    console.log("");

    console.log("2. 🔧 Verify MetaMask Setup:");
    console.log("   - Network: Local (Chain ID: 1337)");
    console.log("   - RPC URL: http://127.0.0.1:7545");
    console.log("   - Account: " + deployerAddress);
    console.log("");

    console.log("3. 🔄 Restart Services:");
    console.log("   Local development:");
    console.log("   - Stop: Ctrl+C");
    console.log("   - Start: npm run dev");
    console.log("");
    console.log("   Docker:");
    console.log("   - Stop: docker-compose down");
    console.log("   - Start: docker-compose up --build");
    console.log("");

    console.log("4. 🐛 Check Console Logs:");
    console.log("   - Open browser DevTools (F12)");
    console.log("   - Check Console tab for error messages");
    console.log("   - Look for ENS or network errors");
    console.log("");

    console.log("5. 🔍 Test API Endpoints:");
    console.log("   After logging in, test these URLs:");
    console.log("   - http://localhost:3000/api/admin/users");
    console.log(
      "   - http://localhost:3000/api/admin/users-with-blockchain-roles"
    );
    console.log("");
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

testAdminAccess().catch(console.error);
