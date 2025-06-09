const hre = require("hardhat");

async function main() {
  console.log("Starting deployment of CertificateNFT contract...");

  // Get the contract factory
  const CertificateNFT = await hre.ethers.getContractFactory("CertificateNFT");

  // Deploy the contract
  console.log("Deploying CertificateNFT...");
  const certificateNFT = await CertificateNFT.deploy();

  await certificateNFT.waitForDeployment();

  console.log(
    "✅ CertificateNFT deployed to:",
    await certificateNFT.getAddress()
  );

  // Get the deployer address
  const [deployer] = await hre.ethers.getSigners();
  console.log("🔑 Deployed by:", await deployer.getAddress());
  const balance = await hre.ethers.provider.getBalance(
    await deployer.getAddress()
  );
  console.log("💰 Account balance:", balance.toString());

  // Verify roles are set up correctly
  const deployerAddress = await deployer.getAddress();
  const hasAdminRole = await certificateNFT.isAdmin(deployerAddress);
  const hasIssuerRole = await certificateNFT.isIssuer(deployerAddress);
  const hasVerifierRole = await certificateNFT.isVerifier(deployerAddress);

  console.log("\n📋 Role Configuration:");
  console.log("Admin role:", hasAdminRole);
  console.log("Issuer role:", hasIssuerRole);
  console.log("Verifier role:", hasVerifierRole);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: await certificateNFT.getAddress(),
    deployer: await deployer.getAddress(),
    deploymentTime: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  console.log("\n📄 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // If deploying to a testnet, print verification command
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 To verify the contract, run:");
    console.log(
      `npx hardhat verify --network ${
        hre.network.name
      } ${await certificateNFT.getAddress()}`
    );
  }

  return certificateNFT;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
