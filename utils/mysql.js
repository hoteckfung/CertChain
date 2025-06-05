import mysql from "mysql2/promise";

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "mysql",
  database: process.env.MYSQL_DATABASE || "certchain",
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
  const { data, error } = await query(
    "INSERT INTO users (wallet_address, role, username, created_at, last_active) VALUES (?, ?, ?, NOW(), NOW())",
    [userData.wallet_address.toLowerCase(), userData.role, userData.username]
  );

  if (error) return { data: null, error };

  // Return the inserted user
  return getUserByWalletAddress(userData.wallet_address);
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

export async function updateUserRole(userId, newRole) {
  const { data, error } = await query(
    "UPDATE users SET role = ? WHERE id = ?",
    [newRole, userId]
  );

  return { data, error };
}

// Activity logging
export async function logActivity(activity) {
  const { user_id, action, details, wallet_address } = activity;

  const { data, error } = await query(
    "INSERT INTO activity_logs (user_id, action, details, wallet_address, created_at) VALUES (?, ?, ?, ?, NOW())",
    [user_id, action, details, wallet_address?.toLowerCase()]
  );

  return { data, error };
}

export async function getActivityLogs(
  limit = 100,
  offset = 0,
  userIdFilter = null
) {
  let sql = `
    SELECT al.*, u.username, u.role 
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
  `;
  let params = [];

  if (userIdFilter) {
    sql += " WHERE al.user_id = ?";
    params.push(userIdFilter);
  }

  sql += " ORDER BY al.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const { data, error } = await query(sql, params);
  return { data, error };
}

// Database initialization - simplified since tables are created manually
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

export default {
  query,
  getUserByWalletAddress,
  createUser,
  updateUser,
  updateUserLastActive,
  getAllUsers,
  updateUserRole,
  logActivity,
  getActivityLogs,
  initializeDatabase,
  checkConnection,
};
