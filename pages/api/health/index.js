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
    // Use SERVER_RPC_URL for server-side calls, fallback to NEXT_PUBLIC_RPC_URL
    const rpcUrl =
      process.env.SERVER_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

    if (!rpcUrl || !contractAddress) {
      throw new Error("Missing blockchain configuration");
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
      rpcUrl: rpcUrl.includes("localhost") ? rpcUrl : "***protected***",
      contractAddress,
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
