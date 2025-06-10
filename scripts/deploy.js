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
  console.log("Contract deployed by:", deployerAddress);

  const hasAdminRole = await certificateNFT.isAdmin(deployerAddress);
  const hasIssuerRole = await certificateNFT.isIssuer(deployerAddress);

  console.log("Deployer has admin role:", hasAdminRole);
  console.log("Deployer has issuer role:", hasIssuerRole);

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

  // Console log the command to update contract address
  console.log(`\n📝 To update contract address, run:`);
  console.log(
    `node scripts/update-contract-address.js ${await certificateNFT.getAddress()}`
  );

  return certificateNFT;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
