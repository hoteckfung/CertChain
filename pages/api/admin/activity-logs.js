// Enhanced activity logs API with filtering and pagination
import { requireAuth, ROLES } from "../../../lib/auth-server";
import mysql from "../../../utils/mysql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Require admin or issuer role
    const auth = await requireAuth([ROLES.ADMIN, ROLES.ISSUER])(req, res);
    if (!auth.user) return; // Response already sent by middleware

    const {
      page = 1,
      limit = 50,
      action,
      severity,
      userId,
      startDate,
      endDate,
      walletAddress,
    } = req.query;

    // Build filter conditions
    let whereConditions = [];
    let params = [];

    if (action) {
      whereConditions.push("action = ?");
      params.push(action);
    }

    if (severity) {
      whereConditions.push("severity = ?");
      params.push(severity);
    }

    if (userId) {
      whereConditions.push("user_id = ?");
      params.push(userId);
    }

    if (walletAddress) {
      whereConditions.push("wallet_address = ?");
      params.push(walletAddress);
    }

    if (startDate) {
      whereConditions.push("created_at >= ?");
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push("created_at <= ?");
      params.push(endDate);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
    `;

    const { data: countResult } = await mysql.query(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Get paginated results
    const query = `
      SELECT 
        al.*,
        u.username,
        u.role as user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const { data: logs, error } = await mysql.query(query, [
      ...params,
      parseInt(limit),
      offset,
    ]);

    if (error) {
      return res.status(500).json({ error: "Failed to fetch activity logs" });
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      logs: logs || [],
      pagination: {
        current: parseInt(page),
        total: totalPages,
        hasNext: hasNextPage,
        hasPrev: hasPrevPage,
        limit: parseInt(limit),
        totalItems: total,
      },
      filters: {
        action,
        severity,
        userId,
        startDate,
        endDate,
        walletAddress,
      },
    });
  } catch (error) {
    console.error("Activity logs error:", error);
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
}
