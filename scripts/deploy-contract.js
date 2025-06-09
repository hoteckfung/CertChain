const { execSync } = require("child_process");
const fs = require("fs");

async function deployContract() {
  console.log("🚀 Deploying smart contract...");

  try {
    // Deploy the contract and capture output
    console.log(
      "📋 Running: npx hardhat run scripts/deploy.js --network ganache"
    );
    const deployOutput = execSync(
      "npx hardhat run scripts/deploy.js --network ganache",
      {
        encoding: "utf8",
        stdio: "pipe",
      }
    );

    console.log("✅ Deployment output:");
    console.log(deployOutput);

    // Extract contract address from output
    const addressMatch =
      deployOutput.match(/deployed to[:\s]+(0x[a-fA-F0-9]{40})/i) ||
      deployOutput.match(/Contract address[:\s]+(0x[a-fA-F0-9]{40})/i) ||
      deployOutput.match(/(0x[a-fA-F0-9]{40})/);

    if (!addressMatch) {
      console.log(
        "⚠️  Could not automatically extract contract address from output."
      );
      console.log("📝 Please manually run:");
      console.log(
        "   node scripts/update-contract-address.js 0xYourContractAddress"
      );
      return;
    }

    const contractAddress = addressMatch[1];
    console.log(`🎯 Detected contract address: ${contractAddress}`);

    // Update configuration files
    console.log("🔄 Updating configuration files...");
    execSync(`node scripts/update-contract-address.js ${contractAddress}`, {
      stdio: "inherit",
    });

    // Rebuild and restart Docker container
    console.log("🔨 Rebuilding Docker container...");
    execSync("docker-compose build webapp", { stdio: "inherit" });

    console.log("🔄 Restarting Docker container...");
    execSync("docker-compose up -d webapp", { stdio: "inherit" });

    console.log("⏳ Waiting for application to start...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    console.log("🎉 Deployment complete!");
    console.log("📍 Your application is running:");
    console.log("   🌐 Web App: http://localhost:3000");
    console.log("   🔍 Health Check: http://localhost:3000/api/health");
    console.log(`   📄 Contract Address: ${contractAddress}`);
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    console.log("🔧 Manual steps:");
    console.log(
      "   1. Deploy contract: npx hardhat run scripts/deploy.js --network ganache"
    );
    console.log(
      "   2. Update address: node scripts/update-contract-address.js 0xYourAddress"
    );
    console.log(
      "   3. Rebuild: docker-compose build webapp && docker-compose up -d webapp"
    );
    process.exit(1);
  }
}

deployContract();
