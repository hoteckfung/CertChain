import mysql from "../../../utils/mysql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    debug: "UPDATED_CODE_VERSION_2.0", // This should appear if code is reloading
    services: {
      database: { status: "unknown", message: "" },
      blockchain: { status: "unknown", message: "" },
      application: { status: "healthy", message: "Application is running" },
    },
  };

  let overallStatus = "healthy";

  // Test Database Connection
  try {
    const { connected, error } = await mysql.checkConnection();

    if (!connected) {
      throw new Error(error?.message || "Database connection failed");
    }

    // Test a basic query
    const { data, error: queryError } = await mysql.query("SELECT 1 as test");

    if (queryError) {
      throw new Error(`Database query failed: ${queryError.message}`);
    }

    health.services.database = {
      status: "healthy",
      message: "Database connection successful",
    };
  } catch (error) {
    health.services.database = {
      status: "unhealthy",
      message: `Database connection failed: ${error.message}`,
    };
    overallStatus = "unhealthy";
  }

  // Test Blockchain Connection
  try {
    // Determine if running in Docker container
    const isInDocker =
      process.env.NODE_ENV === "production" || process.env.DOCKER_CONTAINER;

    // Choose RPC URL based on environment
    let rpcUrl;
    if (isInDocker && process.env.SERVER_RPC_URL) {
      rpcUrl = process.env.SERVER_RPC_URL;
    } else if (process.env.NEXT_PUBLIC_RPC_URL) {
      rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    } else {
      throw new Error("No RPC URL configured");
    }

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

    if (!rpcUrl || !contractAddress) {
      throw new Error(
        `Missing blockchain configuration - RPC URL: ${
          rpcUrl ? "OK" : "MISSING"
        }, Contract Address: ${contractAddress ? "OK" : "MISSING"}, NODE_ENV: ${
          process.env.NODE_ENV
        }, Docker: ${isInDocker ? "YES" : "NO"}`
      );
    }

    // Simple RPC test
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      }),
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`RPC request failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`RPC error: ${data.error.message}`);
    }

    health.services.blockchain = {
      status: "healthy",
      message: `Blockchain connection successful, latest block: ${parseInt(
        data.result,
        16
      )}`,
      rpcUrl:
        rpcUrl.includes("localhost") || rpcUrl.includes("127.0.0.1")
          ? rpcUrl
          : "***protected***",
      contractAddress,
      environment: isInDocker ? "docker" : "local",
    };
  } catch (error) {
    health.services.blockchain = {
      status: "unhealthy",
      message: `Blockchain connection failed: ${error.message}`,
    };
    overallStatus = "unhealthy";
  }

  health.status = overallStatus;

  // Return appropriate HTTP status
  const httpStatus = overallStatus === "healthy" ? 200 : 503;

  res.status(httpStatus).json(health);
}
