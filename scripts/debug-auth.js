#!/usr/bin/env node

require("dotenv").config();
const { ethers } = require("ethers");

// Contract ABI for the functions we need
const CONTRACT_ABI = [
  "function isAdmin(address account) view returns (bool)",
  "function isIssuer(address account) view returns (bool)",
];

async function debugAuth() {
  console.log("🔍 CertChain Authentication Debug");
  console.log("================================\n");

  const deployerAddress = process.env.DEPLOYER_ADDRESS;
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

  if (!deployerAddress || !contractAddress || !rpcUrl) {
    console.error("❌ Missing required environment variables");
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(
      contractAddress,
      CONTRACT_ABI,
      provider
    );

    console.log("🔍 Checking roles for deployer address:", deployerAddress);

    const isAdmin = await contract.isAdmin(deployerAddress);
    const isIssuer = await contract.isIssuer(deployerAddress);

    console.log(`\n📊 Blockchain Role Results:`);
    console.log(`Is Admin: ${isAdmin ? "✅ YES" : "❌ NO"}`);
    console.log(`Is Issuer: ${isIssuer ? "✅ YES" : "❌ NO"}`);

    // Determine what role should be assigned
    let expectedRole = "holder";
    if (isAdmin) {
      expectedRole = "admin";
    } else if (isIssuer) {
      expectedRole = "issuer";
    }

    console.log(`\n🎯 Expected Role: ${expectedRole}`);

    // Simulate the AuthContext logic
    const roleData = {
      walletAddress: deployerAddress,
      roles: {
        isAdmin: isAdmin || false,
        isIssuer: isIssuer || false,
        isHolder: true, // Everyone is a holder
      },
      primaryRole: expectedRole,
      redirectTo: "/dashboard",
      authenticated: true,
    };

    console.log(`\n📋 Simulated AuthContext Data:`);
    console.log(JSON.stringify(roleData, null, 2));

    console.log(`\n🚀 Next Steps to Test:`);
    console.log(
      `1. Make sure your MetaMask is connected to the correct network (Chain ID: ${process.env.NEXT_PUBLIC_CHAIN_ID})`
    );
    console.log(`2. Make sure your MetaMask account is: ${deployerAddress}`);
    console.log(`3. Clear your browser cache and localStorage`);
    console.log(`4. Try logging in again`);
    console.log(
      `5. Check browser console for any errors during authentication`
    );

    if (isAdmin) {
      console.log(`\n✅ Your address SHOULD show Admin Dashboard!`);
      console.log(
        `   If you're still seeing Holder Dashboard, the issue is likely:`
      );
      console.log(`   - Wrong wallet connected in MetaMask`);
      console.log(`   - Cached authentication data`);
      console.log(`   - Network mismatch between app and MetaMask`);
    } else {
      console.log(`\n❌ Your address is NOT an admin on the blockchain.`);
      console.log(`   You need to grant admin role to this address first.`);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

debugAuth().catch(console.error);
