const { ethers } = require("hardhat");

// Load environment variables from .env.local
require("dotenv").config({ path: ".env.local" });

async function grantIssuerRole() {
  console.log("🔑 Granting ISSUER role...");

  // Target account to grant role to (your MetaMask account)
  const accountToGrant = "0x6ae5FfE48c1395260cF096134E5e32725c24080a";

  console.log("🎯 Target account for role grant:", accountToGrant);

  if (!/^0x[a-fA-F0-9]{40}$/.test(accountToGrant)) {
    console.log("❌ Invalid Ethereum address format");
    process.exit(1);
  }

  try {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

    console.log("🔍 Contract address from env:", contractAddress);

    if (!contractAddress) {
      console.log("❌ Contract address not found in environment");
      console.log(
        "Make sure NEXT_PUBLIC_CONTRACT_ADDRESS is set in .env.local"
      );
      process.exit(1);
    }

    // Get the deployed contract using the contract factory
    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    const contract = CertificateNFT.attach(contractAddress);

    // Get the signer (should be the deployer with admin rights)
    const [signer] = await ethers.getSigners();
    console.log("🔑 Using account:", signer.address);

    console.log("📋 Contract:", contractAddress);
    console.log("🎯 Granting ISSUER role to:", accountToGrant);

    // Check if the signer has admin role
    const signerIsAdmin = await contract.isAdmin(signer.address);
    console.log("🛡️  Signer has admin role:", signerIsAdmin);

    if (!signerIsAdmin) {
      console.log(
        "❌ Current account doesn't have admin privileges to grant roles"
      );
      console.log("💡 Make sure you're using the deployer account");
      process.exit(1);
    }

    // Check if account already has issuer role
    const hasRole = await contract.isIssuer(accountToGrant);
    if (hasRole) {
      console.log("✅ Account already has ISSUER role!");
      return;
    }

    // Grant issuer role
    console.log("📤 Submitting transaction...");
    const tx = await contract.grantIssuerRole(accountToGrant);
    console.log("⏳ Transaction hash:", tx.hash);

    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

    // Verify
    const nowHasRole = await contract.isIssuer(accountToGrant);
    console.log("🔍 Verification - Account now has ISSUER role:", nowHasRole);

    if (nowHasRole) {
      console.log("🎉 ISSUER role granted successfully!");
      console.log(
        "💡 You can now use this account in MetaMask to issue certificates!"
      );
    } else {
      console.log("❌ Role grant may have failed - please check transaction");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);

    if (error.message.includes("BAD_DATA")) {
      console.log(
        "💡 This might be an ABI mismatch or contract not properly deployed"
      );
      console.log(
        "💡 Try redeploying: npx hardhat run scripts/deploy.js --network ganache"
      );
    } else if (error.message.includes("execution reverted")) {
      console.log(
        "💡 Transaction reverted - you may not have admin permissions"
      );
    }
  }
}

// Run the script
grantIssuerRole().catch(console.error);
