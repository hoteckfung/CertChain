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

async function testDatabaseConnection() {
  console.log("🔍 Testing MySQL Connection...\n");

  const env = loadEnv();
  const config = {
    host: env.MYSQL_HOST || "localhost",
    port: parseInt(env.MYSQL_PORT) || 3306,
    user: env.MYSQL_USER || "root",
    password: env.MYSQL_PASSWORD || "mysql",
    database: env.MYSQL_DATABASE || "certchain",
  };

  console.log("📋 Connection Config:");
  console.log(`Host: ${config.host}`);
  console.log(`Port: ${config.port}`);
  console.log(`User: ${config.user}`);
  console.log(`Database: ${config.database}\n`);

  let connection;

  try {
    // Test basic connection
    console.log("⏳ Attempting to connect...");
    connection = await mysql.createConnection(config);
    console.log("✅ MySQL connection successful!\n");

    // Test database exists
    const [databases] = await connection.execute("SHOW DATABASES");
    const dbExists = databases.some((db) => db.Database === config.database);

    if (dbExists) {
      console.log(`✅ Database '${config.database}' exists\n`);
    } else {
      console.log(`❌ Database '${config.database}' not found`);
      console.log(
        "Available databases:",
        databases.map((db) => db.Database)
      );
      return;
    }

    // Test tables exist
    const [tables] = await connection.execute("SHOW TABLES");
    console.log("📊 Available tables:");
    tables.forEach((table) => {
      console.log(`  - ${Object.values(table)[0]}`);
    });
    console.log();

    // Check users table structure
    const usersTableExists = tables.some(
      (table) => Object.values(table)[0] === "users"
    );

    if (usersTableExists) {
      console.log("👥 Users table structure:");
      const [columns] = await connection.execute("DESCRIBE users");
      columns.forEach((col) => {
        console.log(
          `  ${col.Field}: ${col.Type} ${
            col.Null === "YES" ? "(nullable)" : "(required)"
          } ${col.Key ? `[${col.Key}]` : ""}`
        );
      });
      console.log();

      // Count users by role
      try {
        const [userCounts] = await connection.execute(
          "SELECT role, COUNT(*) as count FROM users GROUP BY role"
        );
        console.log("👤 Users by role:");
        userCounts.forEach((row) => {
          console.log(`  ${row.role}: ${row.count} users`);
        });
        console.log();
      } catch (err) {
        console.log("⚠️  Could not fetch user role counts:", err.message);
      }

      // Show sample users (without sensitive data)
      try {
        const [sampleUsers] = await connection.execute(
          "SELECT id, username, role, wallet_address, created_at FROM users LIMIT 5"
        );
        if (sampleUsers.length > 0) {
          console.log("📋 Sample users:");
          sampleUsers.forEach((user) => {
            console.log(
              `  ID: ${user.id}, Username: ${user.username}, Role: ${
                user.role
              }, Wallet: ${user.wallet_address?.substring(0, 8)}...`
            );
          });
        } else {
          console.log("📋 No users found in database");
        }
        console.log();
      } catch (err) {
        console.log("⚠️  Could not fetch sample users:", err.message);
      }
    } else {
      console.log("❌ Users table not found");
    }

    // Test activity_logs table
    const activityTableExists = tables.some(
      (table) => Object.values(table)[0] === "activity_logs"
    );
    if (activityTableExists) {
      try {
        const [activityCount] = await connection.execute(
          "SELECT COUNT(*) as count FROM activity_logs"
        );
        console.log(`📝 Activity logs: ${activityCount[0].count} entries`);
      } catch (err) {
        console.log("⚠️  Could not fetch activity log count:", err.message);
      }
    } else {
      console.log("📝 Activity logs table not found");
    }

    console.log("\n🎉 Database connection test completed successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Message: ${error.message}`);

    if (error.code === "ECONNREFUSED") {
      console.log("\n💡 Troubleshooting tips:");
      console.log("1. Make sure MySQL server is running");
      console.log(
        "2. Check if the port 3333 is correct (standard MySQL port is 3306)"
      );
      console.log("3. Verify your MySQL credentials");
      console.log(
        "4. Try connecting with MySQL Workbench first to verify setup"
      );
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("\n💡 Access denied - check your username and password");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.log(
        "\n💡 Database not found - make sure to create the database first"
      );
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
