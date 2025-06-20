const fs = require("fs");
const path = require("path");

function updateContractAddress(newAddress, deployerAddress = null) {
  console.log(`🔄 Updating contract address to: ${newAddress}`);
  if (deployerAddress) {
    console.log(`👤 Setting deployer address to: ${deployerAddress}`);
  }

  // Update .env file
  const envPath = ".env";
  try {
    let envContent = fs.readFileSync(envPath, "utf8");

    // Update contract address
    envContent = envContent.replace(
      /NEXT_PUBLIC_CONTRACT_ADDRESS=0x[a-fA-F0-9]+/,
      `NEXT_PUBLIC_CONTRACT_ADDRESS=${newAddress}`
    );

    // Add or update deployer address if provided
    if (deployerAddress) {
      if (envContent.includes("DEPLOYER_ADDRESS=")) {
        envContent = envContent.replace(
          /DEPLOYER_ADDRESS=0x[a-fA-F0-9]+/,
          `DEPLOYER_ADDRESS=${deployerAddress}`
        );
      } else {
        envContent += `\nDEPLOYER_ADDRESS=${deployerAddress}\n`;
      }
    }

    fs.writeFileSync(envPath, envContent);
    console.log("✅ Updated .env");
  } catch (error) {
    console.error("❌ Error updating .env:", error.message);
    return;
  }

  console.log("🎉 Contract address update complete!");
  if (deployerAddress) {
    console.log("👤 Deployer address set!");
  }
  console.log("📋 Next steps:");
  console.log("   🔧 REQUIRED: Rebuild Docker container:");
  console.log("      docker-compose up --build -d webapp");
  console.log("");
  console.log("   📋 Optional steps:");
  console.log("   - Clean database: node scripts/clean-database.js");
  console.log("   - Verify health: curl http://localhost:3000/api/health");
}

// Get contract address and optional deployer address from command line arguments
const contractAddress = process.argv[2];
const deployerAddress = process.argv[3];

if (!contractAddress) {
  console.error("❌ Please provide a contract address");
  console.log(
    "Usage: node scripts/update-contract-address.js 0xYourContractAddress [0xDeployerAddress]"
  );
  process.exit(1);
}

// Validate address format
if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
  console.error(
    "❌ Invalid contract address format. Should be 0x followed by 40 hex characters"
  );
  process.exit(1);
}

// Validate deployer address format if provided
if (deployerAddress && !/^0x[a-fA-F0-9]{40}$/.test(deployerAddress)) {
  console.error(
    "❌ Invalid deployer address format. Should be 0x followed by 40 hex characters"
  );
  process.exit(1);
}

updateContractAddress(contractAddress, deployerAddress);
