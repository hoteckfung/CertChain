import mysql from "../../../utils/mysql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { page = 1, limit = 20 } = req.query;

    console.log("Testing basic query...");

    // Start with the simplest possible query
    const { data: logs, error: logsError } = await mysql.query(
      "SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10"
    );

    if (logsError) {
      console.error("Database error:", logsError);
      return res.status(500).json({
        error: "Database query failed",
        details: logsError.message,
        hint: "Check if activity_logs table exists",
      });
    }

    console.log(`Found ${logs?.length || 0} logs`);

    // Get count without parameters
    const { data: countData, error: countError } = await mysql.query(
      "SELECT COUNT(*) as total FROM activity_logs"
    );

    const totalCount = countData?.[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Process logs
    const processedLogs = (logs || []).map((log) => ({
      id: log.id,
      type: log.action,
      action: log.action,
      details: log.details,
      wallet_address: log.wallet_address,
      target_address: log.target_wallet_address,
      transaction_hash: log.transaction_hash,
      token_id: log.token_id,
      block_number: log.block_number,
      created_at:
        log.created_at instanceof Date
          ? log.created_at.toISOString()
          : log.created_at,
      category: log.category,
      ipfs_hash: log.ipfs_hash,
    }));

    res.status(200).json({
      success: true,
      logs: processedLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
      debug: {
        tableExists: true,
        totalRecords: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({
      error: "Failed to fetch activity logs",
      details: error.message,
      hint: "Check database connection and table structure",
    });
  }
}
