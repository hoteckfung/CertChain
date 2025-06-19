import mysql from "../../../utils/mysql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { page = 1, limit = 20, type = "all", searchTerm = "" } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    console.log("Query params:", {
      page: pageNum,
      limit: limitNum,
      offset,
      type,
      searchTerm,
    });

    // First, let's test if the table exists and get basic data
    const { data: testData, error: testError } = await mysql.query(
      "SELECT COUNT(*) as total FROM activity_logs",
      []
    );

    if (testError) {
      console.error("Table access error:", testError);
      return res.status(500).json({
        error: "Database table access failed",
        details: testError.message,
        hint: "activity_logs table may not exist or be accessible",
      });
    }

    const totalRecords = testData?.[0]?.total || 0;
    console.log("Total records in activity_logs:", totalRecords);

    // Build WHERE conditions more carefully
    let whereConditions = [];
    let queryParams = [];

    // Always exclude role-related activities (no longer supported)
    whereConditions.push("action NOT IN (?, ?)");
    queryParams.push("ROLE_GRANTED", "ROLE_REVOKED");

    // Filter by activity type
    if (type && type !== "all") {
      whereConditions.push("action = ?");
      queryParams.push(type);
    }

    // Filter by search term (search in details, wallet_address, target_wallet_address)
    if (searchTerm && searchTerm.trim() !== "") {
      whereConditions.push(
        "(details LIKE ? OR wallet_address LIKE ? OR target_wallet_address LIKE ?)"
      );
      const searchPattern = `%${searchTerm.trim()}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Get filtered count
    const countQuery = `SELECT COUNT(*) as total FROM activity_logs ${whereClause}`;
    console.log("Count query:", countQuery, "Params:", queryParams);

    const { data: countData, error: countError } = await mysql.query(
      countQuery,
      queryParams
    );

    if (countError) {
      console.error("Count query error:", countError);
      return res.status(500).json({
        error: "Database count query failed",
        details: countError.message,
        query: countQuery,
        params: queryParams,
      });
    }

    const totalCount = countData?.[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limitNum);

    console.log("Filtered count:", totalCount, "Total pages:", totalPages);

    // Get paginated and filtered logs using string interpolation to avoid parameter binding issues
    const logsQuery = `
      SELECT 
        id, action, details, wallet_address, target_wallet_address,
        transaction_hash, token_id, block_number, created_at, 
        category, ipfs_hash, entity_type
      FROM activity_logs 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    console.log("Logs query:", logsQuery, "Original params:", queryParams);

    const { data: logs, error: logsError } = await mysql.query(
      logsQuery,
      queryParams // Only the WHERE clause parameters
    );

    if (logsError) {
      console.error("Logs query error:", logsError);
      return res.status(500).json({
        error: "Database logs query failed",
        details: logsError.message,
        query: logsQuery,
        params: queryParams,
      });
    }

    console.log(`Found ${logs?.length || 0} logs for page ${pageNum}`);

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
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      filters: {
        type,
        searchTerm,
      },
      debug: {
        totalRecordsInTable: totalRecords,
        filteredCount: totalCount,
        offset,
        limit: limitNum,
        queryUsed: logsQuery,
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({
      error: "Failed to fetch activity logs",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      hint: "Check database connection and table structure",
    });
  }
}
