import mysql from "mysql2/promise";

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper function to execute queries
export async function query(sql, params) {
  try {
    const [rows] = await pool.execute(sql, params);
    return { data: rows, error: null };
  } catch (error) {
    console.error("MySQL query error:", error);
    return { data: null, error };
  }
}

// User operations
export async function getUserByWalletAddress(walletAddress) {
  const { data, error } = await query(
    "SELECT * FROM users WHERE wallet_address = ? LIMIT 1",
    [walletAddress.toLowerCase()]
  );

  if (error) return { data: null, error };
  return { data: data[0] || null, error: null };
}

export async function createUser(userData) {
  const { wallet_address, role, permissions = null } = userData;

  const permissionsJson = permissions ? JSON.stringify(permissions) : null;

  const { data, error } = await query(
    "INSERT INTO users (wallet_address, role, permissions, created_at, last_active) VALUES (?, ?, ?, NOW(), NOW())",
    [wallet_address.toLowerCase(), role, permissionsJson]
  );

  if (error) return { data: null, error };

  // Return the inserted user
  return getUserByWalletAddress(wallet_address);
}

export async function updateUser(userId, userData) {
  const fields = Object.keys(userData);
  const values = Object.values(userData);

  // Build the SET clause dynamically
  const setClause = fields.map((field) => `${field} = ?`).join(", ");

  const { data, error } = await query(
    `UPDATE users SET ${setClause}, last_active = NOW() WHERE id = ?`,
    [...values, userId]
  );

  if (error) return { data: null, error };
  return { data, error: null };
}

export async function updateUserLastActive(walletAddress) {
  const { error } = await query(
    "UPDATE users SET last_active = NOW() WHERE wallet_address = ?",
    [walletAddress.toLowerCase()]
  );

  return { error };
}

export async function getAllUsers(roleFilter = null) {
  let sql = "SELECT * FROM users";
  let params = [];

  if (roleFilter) {
    sql += " WHERE role = ?";
    params.push(roleFilter);
  }

  sql += " ORDER BY created_at DESC";

  const { data, error } = await query(sql, params);
  return { data, error };
}

// NEW: Get admin user overview (uses the view we created)
export async function getAdminUserOverview(roleFilter = null) {
  let sql = "SELECT * FROM admin_user_overview";
  let params = [];

  if (roleFilter) {
    sql += " WHERE role = ?";
    params.push(roleFilter);
  }

  sql += " ORDER BY created_at DESC";

  const { data, error } = await query(sql, params);
  return { data, error };
}

export async function updateUserRole(userId, newRole) {
  const { data, error } = await query(
    "UPDATE users SET role = ? WHERE id = ?",
    [newRole, userId]
  );

  return { data, error };
}

export async function deleteUser(userId) {
  const { data, error } = await query("DELETE FROM users WHERE id = ?", [
    userId,
  ]);

  return { data, error };
}

// Enhanced activity logging
export async function logActivity(activity) {
  const {
    user_id = null,
    action,
    entity_type = "system",
    entity_id = null,
    details = null,
    wallet_address = null,
    target_wallet_address = null,
    certificate_id = null,
    token_id = null,
    ipfs_hash = null,
    transaction_hash = null,
    block_number = null,
    category = "system_event",
  } = activity;

  // Convert undefined values to null for MySQL compatibility
  const params = [
    user_id ?? null,
    action ?? null,
    entity_type ?? "system",
    entity_id ?? null,
    details ?? null,
    wallet_address ? wallet_address.toLowerCase() : null,
    target_wallet_address ? target_wallet_address.toLowerCase() : null,
    certificate_id ?? null,
    token_id ?? null,
    ipfs_hash ?? null,
    transaction_hash ?? null,
    block_number ?? null,
    category ?? "system_event",
  ];

  const { data, error } = await query(
    `INSERT INTO activity_logs (
      user_id, action, entity_type, entity_id, details,
      wallet_address, target_wallet_address, certificate_id, token_id, ipfs_hash,
      transaction_hash, block_number, category, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    params
  );

  return { data, error };
}

export async function getActivityLogs(
  limit = 100,
  offset = 0,
  userIdFilter = null,
  categoryFilter = null,
  actionFilter = null
) {
  let sql = `
    SELECT * FROM activity_logs
    WHERE 1=1
  `;
  let params = [];

  if (userIdFilter) {
    sql += " AND user_id = ?";
    params.push(userIdFilter);
  }

  if (categoryFilter) {
    sql += " AND category = ?";
    params.push(categoryFilter);
  }

  if (actionFilter) {
    sql += " AND action = ?";
    params.push(actionFilter);
  }

  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const { data, error } = await query(sql, params);
  return { data, error };
}

// NEW: Get certificate activity overview (uses the view we created)
export async function getCertificateActivity(limit = 50, offset = 0) {
  const { data, error } = await query(
    "SELECT * FROM admin_certificate_activity LIMIT ? OFFSET ?",
    [limit, offset]
  );
  return { data, error };
}

// USER SESSION MANAGEMENT
export async function createUserSession(sessionData) {
  const { user_id, session_token, wallet_address } = sessionData;

  const { data, error } = await query(
    `INSERT INTO user_sessions (
      user_id, session_token, wallet_address,
      login_time, last_activity, is_active
    ) VALUES (?, ?, ?, NOW(), NOW(), TRUE)`,
    [user_id, session_token, wallet_address.toLowerCase()]
  );

  return { data, error };
}

export async function updateSessionActivity(sessionToken) {
  const { error } = await query(
    "UPDATE user_sessions SET last_activity = NOW() WHERE session_token = ? AND is_active = TRUE",
    [sessionToken]
  );

  return { error };
}

export async function endUserSession(sessionToken) {
  const { error } = await query(
    "UPDATE user_sessions SET logout_time = NOW(), is_active = FALSE WHERE session_token = ?",
    [sessionToken]
  );

  return { error };
}

export async function getUserSessions(userId, activeOnly = false) {
  let sql = "SELECT * FROM user_sessions WHERE user_id = ?";
  let params = [userId];

  if (activeOnly) {
    sql += " AND is_active = TRUE";
  }

  sql += " ORDER BY login_time DESC";

  const { data, error } = await query(sql, params);
  return { data, error };
}

// CERTIFICATE MANAGEMENT
export async function createCertificate(certificateData) {
  const {
    token_id,
    ipfs_hash,
    issuer_id,
    holder_id,
    issuer_wallet,
    holder_wallet,
    title,
    description,
    transaction_hash = null,
    block_number = null,
  } = certificateData;

  const { data, error } = await query(
    `INSERT INTO certificates (
      token_id, ipfs_hash, issuer_id, holder_id, issuer_wallet, holder_wallet,
      title, description, transaction_hash, block_number,
      issue_date, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'issued', NOW())`,
    [
      token_id,
      ipfs_hash,
      issuer_id,
      holder_id,
      issuer_wallet.toLowerCase(),
      holder_wallet.toLowerCase(),
      title,
      description,
      transaction_hash,
      block_number,
    ]
  );

  return { data, error };
}

export async function getCertificatesByHolder(holderWallet) {
  const { data, error } = await query(
    "SELECT * FROM certificates WHERE holder_wallet = ? ORDER BY issue_date DESC",
    [holderWallet.toLowerCase()]
  );

  return { data, error };
}

export async function getCertificatesByIssuer(issuerWallet) {
  const { data, error } = await query(
    "SELECT * FROM certificates WHERE issuer_wallet = ? ORDER BY issue_date DESC",
    [issuerWallet.toLowerCase()]
  );

  return { data, error };
}

export async function getCertificateById(certificateId) {
  const { data, error } = await query(
    "SELECT * FROM certificates WHERE id = ? LIMIT 1",
    [certificateId]
  );

  if (error) return { data: null, error };
  return { data: data[0] || null, error: null };
}

export async function getCertificateByTokenId(tokenId) {
  const { data, error } = await query(
    "SELECT * FROM certificates WHERE token_id = ? LIMIT 1",
    [tokenId]
  );

  if (error) return { data: null, error };
  return { data: data[0] || null, error: null };
}

export async function updateCertificateStatus(certificateId, status) {
  const { data, error } = await query(
    "UPDATE certificates SET status = ? WHERE id = ?",
    [status, certificateId]
  );

  return { data, error };
}

export async function updateCertificateStatusByTokenId(tokenId, status) {
  const { data, error } = await query(
    "UPDATE certificates SET status = ? WHERE token_id = ?",
    [status, tokenId]
  );

  return { data, error };
}

// Database initialization
export async function initializeDatabase() {
  try {
    // Just return success since tables are created manually in MySQL Workbench
    console.log("Database initialization skipped - tables created manually");
    return { success: true, error: null };
  } catch (error) {
    console.error("Database initialization error:", error);
    return { success: false, error };
  }
}

// Check database connection
export async function checkConnection() {
  try {
    await pool.query("SELECT 1");
    return { connected: true, error: null };
  } catch (error) {
    return { connected: false, error };
  }
}

// Get database statistics for admin dashboard
export async function getDatabaseStats() {
  try {
    const [usersResult] = await pool.query(
      "SELECT COUNT(*) as count FROM users"
    );
    const [certificatesResult] = await pool.query(
      "SELECT COUNT(*) as count FROM certificates"
    );
    const [activityResult] = await pool.query(
      "SELECT COUNT(*) as count FROM activity_logs"
    );
    const [sessionsResult] = await pool.query(
      "SELECT COUNT(*) as count FROM user_sessions WHERE is_active = TRUE"
    );

    return {
      data: {
        totalUsers: usersResult[0].count,
        totalCertificates: certificatesResult[0].count,
        totalActivities: activityResult[0].count,
        activeSessions: sessionsResult[0].count,
      },
      error: null,
    };
  } catch (error) {
    console.error("Database stats error:", error);
    return { data: null, error };
  }
}

export default {
  query,
  getUserByWalletAddress,
  createUser,
  updateUser,
  updateUserLastActive,
  getAllUsers,
  getAdminUserOverview,
  updateUserRole,
  deleteUser,
  logActivity,
  getActivityLogs,
  getCertificateActivity,
  createUserSession,
  updateSessionActivity,
  endUserSession,
  getUserSessions,
  createCertificate,
  getCertificatesByHolder,
  getCertificatesByIssuer,
  getCertificateById,
  getCertificateByTokenId,
  updateCertificateStatus,
  updateCertificateStatusByTokenId,
  getDatabaseStats,
  initializeDatabase,
  checkConnection,
};
