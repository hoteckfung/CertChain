import mysql from "mysql2/promise";

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: process.env.MYSQL_PORT || 3333,
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
  const {
    wallet_address,
    role,
    username,
    email = null,
    permissions = null,
  } = userData;

  const permissionsJson = permissions ? JSON.stringify(permissions) : null;

  const { data, error } = await query(
    "INSERT INTO users (wallet_address, role, username, email, permissions, created_at, last_active) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
    [wallet_address.toLowerCase(), role, username, email, permissionsJson]
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

// Enhanced activity logging with severity and metadata
export async function logActivity(activity) {
  const {
    user_id,
    action,
    details,
    wallet_address,
    severity = "info",
    ip_address = null,
    user_agent = null,
  } = activity;

  const { data, error } = await query(
    "INSERT INTO activity_logs (user_id, action, details, wallet_address, severity, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
    [
      user_id,
      action,
      details,
      wallet_address?.toLowerCase(),
      severity,
      ip_address,
      user_agent,
    ]
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

// Profile operations
export async function getProfileByWalletAddress(walletAddress) {
  const { data, error } = await query(
    "SELECT * FROM holder_profiles WHERE wallet_address = ? LIMIT 1",
    [walletAddress.toLowerCase()]
  );

  if (error) return { data: null, error };
  return { data: data[0] || null, error: null };
}

export async function createProfile(profileData) {
  const {
    wallet_address,
    full_name,
    email,
    phone_number,
    privacy_settings = {},
  } = profileData;

  const privacyJson = JSON.stringify(privacy_settings);

  const { data, error } = await query(
    "INSERT INTO holder_profiles (wallet_address, full_name, email, phone_number, privacy_settings, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
    [wallet_address.toLowerCase(), full_name, email, phone_number, privacyJson]
  );

  if (error) return { data: null, error };

  // Return the inserted profile
  return getProfileByWalletAddress(wallet_address);
}

export async function updateProfile(walletAddress, profileData) {
  const { full_name, email, phone_number, privacy_settings } = profileData;

  const privacyJson = privacy_settings
    ? JSON.stringify(privacy_settings)
    : null;

  // Build the update query dynamically based on provided fields
  const updates = [];
  const values = [];

  if (full_name !== undefined) {
    updates.push("full_name = ?");
    values.push(full_name);
  }
  if (email !== undefined) {
    updates.push("email = ?");
    values.push(email);
  }
  if (phone_number !== undefined) {
    updates.push("phone_number = ?");
    values.push(phone_number);
  }
  if (privacy_settings !== undefined) {
    updates.push("privacy_settings = ?");
    values.push(privacyJson);
  }

  if (updates.length === 0) {
    return { data: null, error: new Error("No fields to update") };
  }

  updates.push("updated_at = NOW()");
  values.push(walletAddress.toLowerCase());

  const { data, error } = await query(
    `UPDATE holder_profiles SET ${updates.join(", ")} WHERE wallet_address = ?`,
    values
  );

  if (error) return { data: null, error };

  // Return the updated profile
  return getProfileByWalletAddress(walletAddress);
}

export async function upsertProfile(profileData) {
  const { wallet_address } = profileData;

  // Check if profile exists
  const { data: existingProfile } = await getProfileByWalletAddress(
    wallet_address
  );

  if (existingProfile) {
    return updateProfile(wallet_address, profileData);
  } else {
    return createProfile(profileData);
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
  deleteUser,
  logActivity,
  getActivityLogs,
  getProfileByWalletAddress,
  createProfile,
  updateProfile,
  upsertProfile,
  initializeDatabase,
  checkConnection,
};
