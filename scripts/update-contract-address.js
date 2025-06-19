const fs = require("fs");
const path = require("path");

function updateContractAddress(newAddress, deployerAddress = null) {
  console.log(`🔄 Updating contract address to: ${newAddress}`);
  if (deployerAddress) {
    console.log(`👤 Setting deployer address to: ${deployerAddress}`);
  }

  // Update docker-compose.yml
  const dockerComposePath = "docker-compose.yml";
  try {
    let dockerComposeContent = fs.readFileSync(dockerComposePath, "utf8");

    // Replace the contract address in the build args
    dockerComposeContent = dockerComposeContent.replace(
      /NEXT_PUBLIC_CONTRACT_ADDRESS:\s*0x[a-fA-F0-9]+/,
      `NEXT_PUBLIC_CONTRACT_ADDRESS: ${newAddress}`
    );

    // Also replace in environment section if it exists
    dockerComposeContent = dockerComposeContent.replace(
      /- NEXT_PUBLIC_CONTRACT_ADDRESS=0x[a-fA-F0-9]+/,
      `- NEXT_PUBLIC_CONTRACT_ADDRESS=${newAddress}`
    );

    // Add or update deployer address if provided
    if (deployerAddress) {
      if (dockerComposeContent.includes("DEPLOYER_ADDRESS")) {
        dockerComposeContent = dockerComposeContent.replace(
          /DEPLOYER_ADDRESS:\s*0x[a-fA-F0-9]+/,
          `DEPLOYER_ADDRESS: ${deployerAddress}`
        );
        dockerComposeContent = dockerComposeContent.replace(
          /- DEPLOYER_ADDRESS=0x[a-fA-F0-9]+/,
          `- DEPLOYER_ADDRESS=${deployerAddress}`
        );
      } else {
        // Add deployer address after contract address
        dockerComposeContent = dockerComposeContent.replace(
          /NEXT_PUBLIC_CONTRACT_ADDRESS: 0x[a-fA-F0-9]+/,
          `NEXT_PUBLIC_CONTRACT_ADDRESS: ${newAddress}\n          DEPLOYER_ADDRESS: ${deployerAddress}`
        );
      }
    }

    fs.writeFileSync(dockerComposePath, dockerComposeContent);
    console.log("✅ Updated docker-compose.yml");
  } catch (error) {
    console.error("❌ Error updating docker-compose.yml:", error.message);
  }

  // Update .env.local
  const envPath = ".env.local";
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
    console.log("✅ Updated .env.local");
  } catch (error) {
    console.error("❌ Error updating .env.local:", error.message);
  }

  console.log("🎉 Contract address update complete!");
  if (deployerAddress) {
    console.log("👤 Deployer address set!");
  }
  console.log("📋 Next steps:");
  console.log(
    "   1. Clean database (optional): node scripts/clean-database.js"
  );
  console.log("   2. Rebuild Docker container: docker-compose build webapp");
  console.log("   3. Restart container: docker-compose up -d webapp");
  console.log("   4. Verify health: curl http://localhost:3000/api/health");
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
