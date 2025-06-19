require("dotenv").config();

async function testBlockchainConnection() {
  console.log("Environment variables:");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("NEXT_PUBLIC_RPC_URL:", process.env.NEXT_PUBLIC_RPC_URL);
  console.log("SERVER_RPC_URL:", process.env.SERVER_RPC_URL);
  console.log(
    "NEXT_PUBLIC_CONTRACT_ADDRESS:",
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
  );
  console.log("DOCKER_CONTAINER:", process.env.DOCKER_CONTAINER);
  console.log("");

  // Test the new logic from health check
  let rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.SERVER_RPC_URL;
  console.log("Initial RPC URL:", rpcUrl);

  // If we have SERVER_RPC_URL with docker.internal and it's not in a container, use localhost instead
  if (
    rpcUrl &&
    rpcUrl.includes("host.docker.internal") &&
    !process.env.DOCKER_CONTAINER
  ) {
    console.log("Converting docker.internal to localhost...");
    rpcUrl = rpcUrl.replace("host.docker.internal", "127.0.0.1");
  }

  console.log("Final selected RPC URL:", rpcUrl);
  console.log("Contract Address:", process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);
  console.log("");

  if (!rpcUrl || !process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
    console.error(
      `❌ Missing blockchain configuration - RPC URL: ${
        rpcUrl ? "OK" : "MISSING"
      }, Contract Address: ${
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ? "OK" : "MISSING"
      }, NODE_ENV: ${process.env.NODE_ENV}`
    );
    return;
  }

  try {
    console.log("Testing blockchain connection...");

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      console.error(`❌ RPC request failed: ${response.status}`);
      return;
    }

    const data = await response.json();
    console.log("Response data:", data);

    if (data.error) {
      console.error(`❌ RPC error: ${data.error.message}`);
      return;
    }

    const blockNumber = parseInt(data.result, 16);
    console.log(
      `✅ Blockchain connection successful, latest block: ${blockNumber}`
    );
  } catch (error) {
    console.error(`❌ Blockchain connection failed: ${error.message}`);
    console.error("Error details:", error);
  }
}

testBlockchainConnection();
