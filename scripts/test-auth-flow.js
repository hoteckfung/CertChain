import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

// Read environment variables from .env.local
function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const envVars = {};

    envContent.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });

    return envVars;
  } catch (error) {
    console.log("⚠️  Could not read .env.local file, using defaults");
    return {};
  }
}

async function testAuthFlow() {
  console.log("🔍 Testing Authentication Flow...\n");

  const env = loadEnv();
  const config = {
    host: env.MYSQL_HOST || "localhost",
    port: parseInt(env.MYSQL_PORT) || 3306,
    user: env.MYSQL_USER || "root",
    password: env.MYSQL_PASSWORD || "mysql",
    database: env.MYSQL_DATABASE || "certchain",
  };

  let connection;

  try {
    connection = await mysql.createConnection(config);
    console.log("✅ Connected to database\n");

    // Get all users and their roles
    const [users] = await connection.execute(`
      SELECT id, username, role, wallet_address, is_active, last_active, created_at 
      FROM users 
      ORDER BY role, created_at
    `);

    console.log("👥 Current Users in Database:");
    console.log("=".repeat(80));
    users.forEach((user) => {
      console.log(
        `ID: ${user.id} | Role: ${user.role.padEnd(7)} | Username: ${
          user.username
        }`
      );
      console.log(`   Wallet: ${user.wallet_address}`);
      console.log(
        `   Active: ${user.is_active ? "Yes" : "No"} | Last Active: ${
          user.last_active
        }`
      );
      console.log(`   Created: ${user.created_at}`);
      console.log("-".repeat(80));
    });

    // Test each user's authentication potential
    console.log("\n🧪 Testing Authentication for Each User:");
    console.log("=".repeat(80));

    for (const user of users) {
      console.log(`\n🔐 Testing User: ${user.username} (${user.role})`);
      console.log(`   Wallet: ${user.wallet_address}`);

      // Check if user would be found by wallet lookup
      const [walletLookup] = await connection.execute(
        "SELECT * FROM users WHERE wallet_address = ? LIMIT 1",
        [user.wallet_address.toLowerCase()]
      );

      if (walletLookup.length === 0) {
        console.log("   ❌ Wallet lookup failed - case sensitivity issue?");

        // Test case-insensitive lookup
        const [caseLookup] = await connection.execute(
          "SELECT * FROM users WHERE LOWER(wallet_address) = LOWER(?) LIMIT 1",
          [user.wallet_address]
        );

        if (caseLookup.length > 0) {
          console.log("   ⚠️  Found with case-insensitive lookup");
        }
      } else {
        console.log("   ✅ Wallet lookup successful");

        // Check what routes this user should access
        const roleRoutes = {
          admin: ["/admin", "/issuer", "/holder"],
          issuer: ["/issuer", "/holder"],
          holder: ["/holder"],
        };

        const allowedRoutes = roleRoutes[user.role] || [];
        console.log(`   📍 Allowed routes: ${allowedRoutes.join(", ")}`);

        // Check if user is active
        if (user.is_active === 0) {
          console.log("   ⚠️  User is marked as inactive");
        }
      }
    }

    // Check for duplicate wallet addresses
    console.log("\n🔍 Checking for Duplicate Wallets:");
    const [duplicates] = await connection.execute(`
      SELECT LOWER(wallet_address) as wallet_address, COUNT(*) as count 
      FROM users 
      GROUP BY LOWER(wallet_address) 
      HAVING count > 1
    `);

    if (duplicates.length > 0) {
      console.log("❌ Found duplicate wallet addresses:");
      duplicates.forEach((dup) => {
        console.log(`   ${dup.wallet_address}: ${dup.count} times`);
      });
    } else {
      console.log("✅ No duplicate wallet addresses found");
    }

    // Check recent activity logs for authentication attempts
    console.log("\n📊 Recent Authentication Activity:");
    const [recentActivity] = await connection.execute(`
      SELECT action, wallet_address, details, severity, created_at, ip_address
      FROM activity_logs 
      WHERE action IN ('user_login', 'login_failed', 'user_logout')
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    if (recentActivity.length > 0) {
      recentActivity.forEach((log) => {
        const timeAgo = new Date(
          Date.now() - new Date(log.created_at).getTime()
        )
          .toISOString()
          .substr(11, 8);
        console.log(
          `   ${log.action.padEnd(12)} | ${log.wallet_address?.substring(
            0,
            8
          )}... | ${log.created_at} | ${log.details}`
        );
      });
    } else {
      console.log("   No recent authentication activity found");
    }

    // Test database performance
    console.log("\n⚡ Database Performance Test:");
    const start = Date.now();
    await connection.execute("SELECT COUNT(*) FROM users");
    const userQueryTime = Date.now() - start;

    const start2 = Date.now();
    await connection.execute("SELECT COUNT(*) FROM activity_logs");
    const logQueryTime = Date.now() - start2;

    console.log(`   User query: ${userQueryTime}ms`);
    console.log(`   Log query: ${logQueryTime}ms`);

    console.log("\n🎯 Recommendations:");

    if (users.length === 0) {
      console.log("   ⚠️  No users found - create test users first");
    }

    const inactiveUsers = users.filter((u) => u.is_active === 0);
    if (inactiveUsers.length > 0) {
      console.log(
        `   ⚠️  ${inactiveUsers.length} inactive users found - they cannot login`
      );
    }

    console.log("   💡 Try logging in with one of the active users above");
    console.log("   💡 Check browser console for authentication errors");
    console.log(
      "   💡 Check if wallet is connected and on the correct network"
    );
  } catch (error) {
    console.error("❌ Auth flow test failed:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testAuthFlow().catch(console.error);
