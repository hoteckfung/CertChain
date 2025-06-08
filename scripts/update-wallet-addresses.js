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

async function updateWalletAddresses() {
  console.log("🔄 Updating wallet addresses for role assignments...\n");

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

    // New wallet address assignments
    const newAssignments = {
      admin: "0x241dBc6d5f283964536A94e33E2323B7580CE45A",
      issuer: "0x6ae5FfE48c1395260cF096134E5e32725c24080a",
      holder: "0x01178ee99F7E50957Ab591b0C7ca307E593254C9",
    };

    console.log("📋 New wallet address assignments:");
    console.log(`   Admin:  ${newAssignments.admin}`);
    console.log(`   Issuer: ${newAssignments.issuer}`);
    console.log(`   Holder: ${newAssignments.holder}\n`);

    // Show current users
    const [currentUsers] = await connection.execute(
      "SELECT id, username, role, wallet_address FROM users ORDER BY role, created_at"
    );
    console.log("👥 Current users in database:");
    currentUsers.forEach((user) => {
      console.log(
        `   ${user.id}: ${user.username} (${user.role}) - ${user.wallet_address}`
      );
    });
    console.log();

    // Update existing users to match new assignments
    console.log("🔄 Updating user roles and addresses...");

    // 1. Update the user who has the admin wallet to be admin
    const [adminUpdate] = await connection.execute(
      "UPDATE users SET role = ?, username = ? WHERE LOWER(wallet_address) = LOWER(?)",
      ["admin", "System Admin", newAssignments.admin]
    );
    console.log(
      `   ✅ Updated admin user (${adminUpdate.affectedRows} rows affected)`
    );

    // 2. Update the issuer (this one should be the same)
    const [issuerUpdate] = await connection.execute(
      "UPDATE users SET role = ?, username = ? WHERE LOWER(wallet_address) = LOWER(?)",
      ["issuer", "Test Issuer", newAssignments.issuer]
    );
    console.log(
      `   ✅ Updated issuer user (${issuerUpdate.affectedRows} rows affected)`
    );

    // 3. Update the holder (this one should be the same)
    const [holderUpdate] = await connection.execute(
      "UPDATE users SET role = ?, username = ? WHERE LOWER(wallet_address) = LOWER(?)",
      ["holder", "Test Holder", newAssignments.holder]
    );
    console.log(
      `   ✅ Updated holder user (${holderUpdate.affectedRows} rows affected)`
    );

    // 4. Handle any other users - set them to holder role
    const [otherUsers] = await connection.execute(
      `
      SELECT id, wallet_address, username FROM users 
      WHERE LOWER(wallet_address) NOT IN (LOWER(?), LOWER(?), LOWER(?))
    `,
      [newAssignments.admin, newAssignments.issuer, newAssignments.holder]
    );

    if (otherUsers.length > 0) {
      console.log(
        `   ⚠️  Found ${otherUsers.length} other users, setting them to holder role:`
      );
      for (const user of otherUsers) {
        await connection.execute("UPDATE users SET role = ? WHERE id = ?", [
          "holder",
          user.id,
        ]);
        console.log(
          `     - ${
            user.username || user.wallet_address.substring(0, 10)
          }... → holder`
        );
      }
    }

    // Show final results
    console.log("\n📊 Final user assignments:");
    const [finalUsers] = await connection.execute(
      "SELECT id, username, role, wallet_address, is_active FROM users ORDER BY role, created_at"
    );
    finalUsers.forEach((user) => {
      const status = user.is_active ? "✅" : "❌";
      console.log(
        `   ${status} ${user.username} (${user.role}) - ${user.wallet_address}`
      );
    });

    // Log the changes in activity logs
    await connection.execute(`
      INSERT INTO activity_logs (user_id, action, details, wallet_address, severity, created_at) 
      VALUES (NULL, 'system_update', 'Wallet addresses updated for role assignments', NULL, 'info', NOW())
    `);

    console.log("\n🎉 Wallet address update completed successfully!");
  } catch (error) {
    console.error("❌ Failed to update wallet addresses:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the update
updateWalletAddresses().catch(console.error);
