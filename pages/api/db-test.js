import mysql from "../../utils/mysql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Test database connection
    const { connected, error } = await mysql.checkConnection();

    if (!connected) {
      return res.status(500).json({
        status: "error",
        error: error?.message || "Database connection failed",
        code: error?.code || "CONNECTION_ERROR",
      });
    }

    // Test basic query
    const { data, error: queryError } = await mysql.query(
      "SELECT COUNT(*) as user_count FROM users"
    );

    if (queryError) {
      return res.status(500).json({
        status: "error",
        error: "Database query failed",
        details: queryError.message,
      });
    }

    res.status(200).json({
      status: "success",
      message: "Database connection successful",
      userCount: data[0]?.user_count || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database test error:", error);
    res.status(500).json({
      status: "error",
      error: "Internal server error",
      details: error.message,
    });
  }
}
