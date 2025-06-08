const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Load environment variables
if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  envContent.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value && !key.startsWith("#")) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// Enhanced database setup with the new schema
async function setupDatabase() {
  let connection;

  try {
    console.log("🚀 Starting enhanced database setup...");

    // Connect to MySQL (without specifying database first)
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      port: process.env.MYSQL_PORT || 3333,
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "mysql",
      multipleStatements: true,
    });

    console.log("✅ Connected to MySQL server");

    // Read the schema file
    const schemaPath = path.join(process.cwd(), "certchain.session.sql");

    if (!fs.existsSync(schemaPath)) {
      throw new Error("Schema file not found: certchain.session.sql");
    }

    const schema = fs.readFileSync(schemaPath, "utf8");
    console.log("📄 Loaded schema file");

    // Execute the schema
    console.log("⚡ Executing database schema...");
    await connection.query(schema);
    console.log("✅ Database schema executed successfully");

    // Verify tables were created
    await connection.query("USE certchain");
    const [tables] = await connection.query("SHOW TABLES");

    console.log("📊 Created tables:");
    tables.forEach((table) => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });

    // Verify admin user exists
    const [adminUser] = await connection.query(
      'SELECT * FROM users WHERE role = "admin" LIMIT 1'
    );

    if (adminUser.length > 0) {
      console.log("👤 Admin user verified:");
      console.log(`  - Wallet: ${adminUser[0].wallet_address}`);
      console.log(`  - Username: ${adminUser[0].username}`);
      console.log(`  - Permissions: ${adminUser[0].permissions}`);
    } else {
      console.log("⚠️  No admin user found");
    }

    // Test database operations
    console.log("🧪 Testing database operations...");

    // Test user creation with permissions
    const testWallet = "0x1234567890123456789012345678901234567890";
    const testPermissions = JSON.stringify(["verify_certificates"]);

    try {
      await connection.query(
        "INSERT INTO users (wallet_address, role, username, permissions, created_at, last_active) VALUES (?, ?, ?, ?, NOW(), NOW())",
        [testWallet, "holder", "Test User", testPermissions]
      );

      // Read back the test user
      const [testUser] = await connection.query(
        "SELECT * FROM users WHERE wallet_address = ?",
        [testWallet]
      );

      if (testUser.length > 0) {
        console.log("✅ User creation test passed");

        // Test activity logging with enhanced fields
        await connection.query(
          "INSERT INTO activity_logs (user_id, action, details, wallet_address, severity, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
          [
            testUser[0].id,
            "test_action",
            "Database setup test",
            testWallet,
            "info",
            "127.0.0.1",
            "Setup Script",
          ]
        );

        console.log("✅ Activity logging test passed");

        // Clean up test data
        await connection.query(
          'DELETE FROM activity_logs WHERE action = "test_action"'
        );
        await connection.query("DELETE FROM users WHERE wallet_address = ?", [
          testWallet,
        ]);
        console.log("✅ Test cleanup completed");
      }
    } catch (testError) {
      console.error("❌ Database operation test failed:", testError.message);
    }

    // Display connection info
    console.log("📋 Database connection details:");
    console.log(`  - Host: ${process.env.MYSQL_HOST || "localhost"}`);
    console.log(`  - Database: certchain`);
    console.log(`  - User: ${process.env.MYSQL_USER || "root"}`);

    console.log("🎉 Database setup completed successfully!");
    console.log("");
    console.log("📋 Next steps:");
    console.log(
      "  1. Update your admin wallet address in the users table if needed"
    );
    console.log("  2. Run: npm run dev");
    console.log("  3. Test authentication with your wallet");
    console.log("  4. Check the activity logs in /api/admin/activity-logs");
  } catch (error) {
    console.error("❌ Database setup failed:");
    console.error("Error:", error.message);
    console.error("Error Code:", error.code);
    console.error("Error Details:", error);
    console.error("");
    console.error("🔧 Troubleshooting:");
    console.error("  1. Ensure MySQL is running");
    console.error(
      "  2. Check your .env.local file has correct database credentials"
    );
    console.error("  3. Verify the schema file exists: certchain.session.sql");
    console.error(
      "  4. Check MySQL user has CREATE, INSERT, UPDATE privileges"
    );
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
