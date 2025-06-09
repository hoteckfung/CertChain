const { ethers } = require("ethers");

async function testConnection() {
  console.log("🔍 Testing blockchain connection...");
  console.log("=====================================");

  // Load environment variables
  require("dotenv").config({ path: ".env.local" });

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID;
  const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

  console.log("Configuration:");
  console.log(`  Contract Address: ${CONTRACT_ADDRESS}`);
  console.log(`  Chain ID: ${CHAIN_ID}`);
  console.log(`  RPC URL: ${RPC_URL}`);
  console.log("");

  // Test 1: RPC Connection
  console.log("1️⃣ Testing RPC connection...");
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const network = await provider.getNetwork();
    console.log(
      `   ✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`
    );

    // Check if chain ID matches
    if (network.chainId.toString() !== CHAIN_ID) {
      console.log(
        `   ⚠️  Warning: Expected Chain ID ${CHAIN_ID}, got ${network.chainId}`
      );
    }
  } catch (error) {
    console.log(`   ❌ RPC connection failed: ${error.message}`);
    console.log("   💡 Make sure Ganache is running on the specified URL");
    return;
  }

  // Test 2: Contract Address Validity
  console.log("\n2️⃣ Testing contract address...");
  if (
    !CONTRACT_ADDRESS ||
    CONTRACT_ADDRESS === "0x..." ||
    CONTRACT_ADDRESS.length !== 42
  ) {
    console.log("   ❌ Invalid contract address");
    console.log(
      "   💡 Deploy the contract first: npx hardhat run scripts/deploy.js --network ganache"
    );
    return;
  }
  console.log("   ✅ Contract address format is valid");

  // Test 3: Contract Deployment
  console.log("\n3️⃣ Testing contract deployment...");
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const code = await provider.getCode(CONTRACT_ADDRESS);

    if (code === "0x") {
      console.log("   ❌ No contract found at this address");
      console.log(
        "   💡 Deploy the contract: npx hardhat run scripts/deploy.js --network ganache"
      );
      return;
    }
    console.log("   ✅ Contract is deployed");
  } catch (error) {
    console.log(`   ❌ Error checking contract: ${error.message}`);
    return;
  }

  // Test 4: Contract Functions
  console.log("\n4️⃣ Testing contract functions...");
  try {
    const ABI = [
      "function getTotalCertificates() view returns (uint256)",
      "function paused() view returns (bool)",
    ];

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    const totalCerts = await contract.getTotalCertificates();
    const isPaused = await contract.paused();

    console.log(`   ✅ Total certificates: ${totalCerts}`);
    console.log(`   ✅ Contract paused: ${isPaused}`);

    if (isPaused) {
      console.log(
        "   ⚠️  Warning: Contract is paused - transactions will fail"
      );
    }
  } catch (error) {
    console.log(`   ❌ Error calling contract functions: ${error.message}`);
    console.log("   💡 Contract may not be properly deployed or ABI mismatch");
    return;
  }

  // Test 5: Account Check (if private key available)
  console.log("\n5️⃣ Testing deployment account...");
  try {
    require("dotenv").config({ path: ".env" });
    const PRIVATE_KEY = process.env.PRIVATE_KEY;

    if (!PRIVATE_KEY) {
      console.log("   ⚠️  No private key found in .env file");
      console.log(
        "   💡 This is needed for deployment but not for testing read functions"
      );
    } else {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      const balance = await provider.getBalance(wallet.address);
      const balanceEth = ethers.formatEther(balance);

      console.log(`   ✅ Deployment account: ${wallet.address}`);
      console.log(`   ✅ Account balance: ${balanceEth} ETH`);

      if (parseFloat(balanceEth) < 0.01) {
        console.log("   ⚠️  Low balance - may not be enough for transactions");
      }

      // Check if this account has issuer role
      try {
        const ABI = ["function isIssuer(address account) view returns (bool)"];
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        const isIssuer = await contract.isIssuer(wallet.address);
        console.log(`   ✅ Has issuer role: ${isIssuer}`);
      } catch (roleError) {
        console.log(`   ❌ Could not check issuer role: ${roleError.message}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error checking deployment account: ${error.message}`);
  }

  console.log("\n🎉 Connection test completed!");
  console.log("\n📝 Next steps:");
  console.log("   1. Make sure Ganache is running");
  console.log(
    "   2. Connect MetaMask to Ganache network (RPC: " +
      RPC_URL +
      ", Chain ID: " +
      CHAIN_ID +
      ")"
  );
  console.log("   3. Import a Ganache account into MetaMask");
  console.log("   4. Try issuing a certificate from the web interface");
}

// Run the test
testConnection().catch(console.error);
