const fs = require("fs");
const path = require("path");

function updateContractAddress(newAddress) {
  console.log(`🔄 Updating contract address to: ${newAddress}`);

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

    fs.writeFileSync(dockerComposePath, dockerComposeContent);
    console.log("✅ Updated docker-compose.yml");
  } catch (error) {
    console.error("❌ Error updating docker-compose.yml:", error.message);
  }

  // Update .env.local
  const envPath = ".env.local";
  try {
    let envContent = fs.readFileSync(envPath, "utf8");
    envContent = envContent.replace(
      /NEXT_PUBLIC_CONTRACT_ADDRESS=0x[a-fA-F0-9]+/,
      `NEXT_PUBLIC_CONTRACT_ADDRESS=${newAddress}`
    );
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Updated .env.local");
  } catch (error) {
    console.error("❌ Error updating .env.local:", error.message);
  }

  console.log("🎉 Contract address update complete!");
  console.log("📋 Next steps:");
  console.log("   1. Rebuild Docker container: docker-compose build webapp");
  console.log("   2. Restart container: docker-compose up -d webapp");
  console.log("   3. Verify health: curl http://localhost:3000/api/health");
}

// Get contract address from command line argument
const contractAddress = process.argv[2];

if (!contractAddress) {
  console.error("❌ Please provide a contract address");
  console.log(
    "Usage: node scripts/update-contract-address.js 0xYourContractAddress"
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

updateContractAddress(contractAddress);
