import mysql from "../../utils/mysql";

export default async function handler(req, res) {
  try {
    // Test database connection
    const { connected, error } = await mysql.checkConnection();

    if (!connected) {
      return res.status(500).json({
        status: "error",
        message: "Database connection failed",
        error: error?.message || "Unknown error",
        config: {
          host: process.env.MYSQL_HOST || "localhost",
          port: process.env.MYSQL_PORT || 3306,
          user: process.env.MYSQL_USER || "root",
          database: process.env.MYSQL_DATABASE || "certchain",
        },
      });
    }

    // Test a simple query
    const { data, error: queryError } = await mysql.query(
      "SELECT COUNT(*) as user_count FROM users"
    );

    if (queryError) {
      return res.status(500).json({
        status: "error",
        message: "Database query failed",
        error: queryError.message,
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
      message: "Database test failed",
      error: error.message,
    });
  }
}
