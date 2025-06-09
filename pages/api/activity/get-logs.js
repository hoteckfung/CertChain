import { connectToDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      page = 1,
      limit = 50,
      type,
      walletAddress,
      startDate,
      endDate,
      searchTerm,
    } = req.query;

    const connection = await connectToDatabase();

    // Build dynamic WHERE clause
    let whereConditions = [];
    let queryParams = [];

    if (type && type !== "all") {
      whereConditions.push("type = ?");
      queryParams.push(type);
    }

    if (walletAddress) {
      whereConditions.push("(wallet_address = ? OR target_address = ?)");
      queryParams.push(walletAddress, walletAddress);
    }

    if (startDate) {
      whereConditions.push("created_at >= ?");
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push("created_at <= ?");
      queryParams.push(endDate);
    }

    if (searchTerm) {
      whereConditions.push(
        "(details LIKE ? OR wallet_address LIKE ? OR target_address LIKE ?)"
      );
      const searchPattern = `%${searchTerm}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";

    // Get total count for pagination
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM activity_logs ${whereClause}`,
      queryParams
    );
    const totalCount = countResult[0].total;

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Get paginated results
    const [logs] = await connection.execute(
      `SELECT 
        id,
        type,
        wallet_address,
        target_address,
        details,
        transaction_hash,
        block_number,
        token_id,
        ipfs_hash,
        metadata,
        created_at
      FROM activity_logs 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), offset]
    );

    // Parse metadata JSON
    const processedLogs = logs.map((log) => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : {},
      created_at: log.created_at.toISOString(),
    }));

    await connection.end();

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
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({
      error: "Failed to fetch activity logs",
      details: error.message,
    });
  }
}
