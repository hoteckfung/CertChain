/**
 * Database Clean Script for CertChain
 *
 * This script performs a complete database clean for development purposes.
 * It removes all certificates, users, activity logs, and sessions,
 * and resets auto-increment counters.
 *
 * Use this when you want to start fresh or reset your development environment.
 *
 * Usage:
 *   node scripts/clean-database.js             - Clean entire database
 *   node scripts/clean-database.js -c          - Clean only certificates
 *   node scripts/clean-database.js --certificates-only - Clean only certificates
 *   node scripts/clean-database.js --help      - Show this help
 */

// Load environment variables
require("dotenv").config({ path: ".env" });
const mysql = require("mysql2/promise");

// Helper function to get database configuration
function getDatabaseConfig() {
  // Use Docker MySQL settings if no environment overrides are provided
  return {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3307"), // Docker MySQL port
    user: process.env.DB_USER || process.env.MYSQL_USER || "certchain_user", // Docker MySQL user
    password:
      process.env.DB_PASSWORD ||
      process.env.MYSQL_PASSWORD ||
      "certchain_password", // Docker MySQL password
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || "certchain",
  };
}

async function forceCleanDatabase() {
  let connection;

  try {
    console.log("🔌 Establishing direct database connection...");

    // Get database config from environment
    const dbConfig = getDatabaseConfig();

    console.log(
      `🔧 Connecting to database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`
    );
    connection = await mysql.createConnection(dbConfig);

    // Check connection
    await connection.query("SELECT 1");
    console.log("✅ Database connection successful!");

    // Get current counts
    console.log("\n📊 Current database state:");
    const [userRows] = await connection.query(
      "SELECT COUNT(*) as count FROM users"
    );
    const [certRows] = await connection.query(
      "SELECT COUNT(*) as count FROM certificates"
    );
    const [activityRows] = await connection.query(
      "SELECT COUNT(*) as count FROM activity_logs"
    );
    const [sessionRows] = await connection.query(
      "SELECT COUNT(*) as count FROM user_sessions"
    );

    console.log(`   👥 Users: ${userRows[0].count}`);
    console.log(`   📜 Certificates: ${certRows[0].count}`);
    console.log(`   📋 Activity logs: ${activityRows[0].count}`);
    console.log(`   🔐 User sessions: ${sessionRows[0].count}`);

    const totalRecords =
      userRows[0].count +
      certRows[0].count +
      activityRows[0].count +
      sessionRows[0].count;

    if (totalRecords === 0) {
      console.log("✅ Database is already clean - no data to remove");
      return;
    }

    console.log("\n🔄 Disabling foreign key checks...");
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    // Also clear localStorage in browser if needed
    console.log(
      "💡 Note: If you still see certificates in the UI after cleaning,"
    );
    console.log(
      "   visit http://localhost:3000/clear-storage.html to clear browser storage"
    );

    // Force clean all tables
    console.log("🧹 Cleaning tables with TRUNCATE...");

    const tables = [
      { name: "activity_logs", description: "Activity logs" },
      { name: "certificates", description: "Certificates" },
      { name: "user_sessions", description: "User sessions" },
      { name: "users", description: "Users" },
    ];

    for (const table of tables) {
      try {
        console.log(`   🔄 Truncating ${table.description}...`);
        await connection.query(`TRUNCATE TABLE ${table.name}`);
        console.log(`   ✅ ${table.name} truncated successfully`);
      } catch (error) {
        console.error(`   ❌ Error truncating ${table.name}: ${error.message}`);
        // Try with DELETE as fallback
        try {
          console.log(`   🔄 Trying DELETE FROM ${table.name} instead...`);
          const [result] = await connection.query(`DELETE FROM ${table.name}`);
          console.log(
            `   ✅ Removed ${result.affectedRows} records from ${table.name}`
          );
        } catch (deleteError) {
          console.error(`   ❌ DELETE also failed: ${deleteError.message}`);
        }
      }
    }

    console.log("\n🔄 Re-enabling foreign key checks...");
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("\n🔄 Resetting auto-increment counters...");
    for (const table of tables) {
      try {
        await connection.query(`ALTER TABLE ${table.name} AUTO_INCREMENT = 1`);
        console.log(`   ✅ Reset auto-increment for ${table.name}`);
      } catch (error) {
        console.error(
          `   ❌ Error resetting auto-increment for ${table.name}: ${error.message}`
        );
      }
    }

    // Verify clean
    console.log("\n🔍 Verifying database is clean...");
    const [userCheck] = await connection.query(
      "SELECT COUNT(*) as count FROM users"
    );
    const [certCheck] = await connection.query(
      "SELECT COUNT(*) as count FROM certificates"
    );
    const [activityCheck] = await connection.query(
      "SELECT COUNT(*) as count FROM activity_logs"
    );
    const [sessionCheck] = await connection.query(
      "SELECT COUNT(*) as count FROM user_sessions"
    );

    const remainingRecords =
      userCheck[0].count +
      certCheck[0].count +
      activityCheck[0].count +
      sessionCheck[0].count;

    if (remainingRecords === 0) {
      console.log("✅ Database is now completely clean!");
      console.log(`📊 Total records removed: ${totalRecords}`);
    } else {
      console.log("⚠️ Some records still remain:");
      console.log(`   👥 Users: ${userCheck[0].count}`);
      console.log(`   📜 Certificates: ${certCheck[0].count}`);
      console.log(`   📋 Activity logs: ${activityCheck[0].count}`);
      console.log(`   🔐 User sessions: ${sessionCheck[0].count}`);

      // Force one more attempt with direct DELETE
      console.log(
        "\n🔄 Attempting final cleanup with direct DELETE statements..."
      );

      for (const table of tables) {
        try {
          const [result] = await connection.query(`DELETE FROM ${table.name}`);
          console.log(
            `   ✅ Final cleanup: Removed ${result.affectedRows} records from ${table.name}`
          );
        } catch (error) {
          console.error(
            `   ❌ Final cleanup failed for ${table.name}: ${error.message}`
          );
        }
      }
    }
  } catch (error) {
    console.error("❌ Database clean failed:", error);
    console.error("\n🔧 Troubleshooting:");
    console.error("- Check your database connection settings in .env");
    console.error(
      "- Ensure Docker containers are running: docker-compose up -d"
    );
    console.error(
      "- Verify MySQL is accessible on port 3307: docker exec certchain-mysql mysql -u certchain_user -pcertchain_password -e 'SHOW DATABASES;'"
    );
    console.error(
      "- Or test as root: docker exec certchain-mysql mysql -u root -pmysql -e 'SHOW DATABASES;'"
    );
    console.error(
      "- Check database user permissions: make sure your user has DELETE privileges"
    );
    process.exit(1);
  } finally {
    if (connection) {
      console.log("🔌 Closing database connection...");
      await connection.end();
    }
  }
}

// Add function to clean just certificates
async function cleanCertificatesOnly() {
  let connection;

  try {
    console.log("🔌 Establishing direct database connection...");

    // Get database config from environment
    const dbConfig = getDatabaseConfig();

    console.log(
      `🔧 Connecting to database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`
    );
    connection = await mysql.createConnection(dbConfig);

    // Check connection
    await connection.query("SELECT 1");
    console.log("✅ Database connection successful!");

    // Get current certificate count
    console.log("\n📊 Current certificates:");
    const [certRows] = await connection.query(
      "SELECT COUNT(*) as count FROM certificates"
    );
    console.log(`   📜 Certificates: ${certRows[0].count}`);

    if (certRows[0].count === 0) {
      console.log("✅ No certificates to remove - already clean");
      return;
    }

    console.log("\n🔄 Disabling foreign key checks...");
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    // First clean activity logs related to certificates
    console.log("\n🧹 Cleaning activity logs related to certificates...");
    try {
      const [activityResult] = await connection.query(
        "DELETE FROM activity_logs WHERE entity_type = 'certificate' OR category = 'certificate_management'"
      );
      console.log(
        `   ✅ Removed ${activityResult.affectedRows} certificate-related activity logs`
      );
    } catch (error) {
      console.error(
        `   ❌ Error cleaning certificate activity logs: ${error.message}`
      );
    }

    // Now clean certificates
    console.log("\n🧹 Cleaning certificates...");
    try {
      const [certResult] = await connection.query(
        "TRUNCATE TABLE certificates"
      );
      console.log(`   ✅ Certificates truncated successfully`);
    } catch (error) {
      console.error(`   ❌ Error truncating certificates: ${error.message}`);
      // Try with DELETE as fallback
      try {
        const [result] = await connection.query("DELETE FROM certificates");
        console.log(`   ✅ Removed ${result.affectedRows} certificates`);
      } catch (deleteError) {
        console.error(`   ❌ DELETE also failed: ${deleteError.message}`);
      }
    }

    // Reset auto-increment
    console.log("\n🔄 Resetting certificate table auto-increment...");
    try {
      await connection.query("ALTER TABLE certificates AUTO_INCREMENT = 1");
      console.log("   ✅ Auto-increment reset successfully");
    } catch (error) {
      console.error(`   ❌ Error resetting auto-increment: ${error.message}`);
    }

    console.log("\n🔄 Re-enabling foreign key checks...");
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    // Verify clean
    console.log("\n🔍 Verifying certificates are removed...");
    const [verifyRows] = await connection.query(
      "SELECT COUNT(*) as count FROM certificates"
    );

    if (verifyRows[0].count === 0) {
      console.log("✅ All certificates successfully removed!");
      console.log(`📊 Total certificates removed: ${certRows[0].count}`);
    } else {
      console.log(
        `⚠️ Warning: ${verifyRows[0].count} certificates still remain`
      );
    }
  } catch (error) {
    console.error("❌ Certificate clean failed:", error);
    throw error;
  } finally {
    if (connection) {
      console.log("🔌 Closing database connection...");
      await connection.end();
    }
  }
}

// Run the script
if (require.main === module) {
  // Check for arguments
  const args = process.argv.slice(2);
  const showHelp = args.includes("--help") || args.includes("-h");
  const certificatesOnly =
    args.includes("--certificates-only") || args.includes("-c");

  // Show help text if requested
  if (showHelp) {
    console.log("🔍 CertChain Database Clean Help");
    console.log("==============================");
    console.log("");
    console.log("Usage:");
    console.log(
      "  node scripts/clean-database.js             - Clean entire database"
    );
    console.log(
      "  node scripts/clean-database.js -c          - Clean only certificates"
    );
    console.log(
      "  node scripts/clean-database.js --certificates-only - Clean only certificates"
    );
    console.log(
      "  node scripts/clean-database.js --help      - Show this help"
    );
    console.log("");
    console.log("Description:");
    console.log(
      "  This script cleans the CertChain database for development purposes."
    );
    console.log(
      "  It can either remove all data (default) or just certificates (-c flag)."
    );
    console.log("  After cleaning, it resets auto-increment counters.");
    console.log("");
    console.log(
      "Note: If you still see certificates in the UI after cleaning,"
    );
    console.log(
      "visit http://localhost:3000/clear-storage.html to clear browser storage."
    );
    process.exit(0);
  }

  console.log("🏆 CertChain Database Clean");
  console.log("==========================");
  console.log("");

  if (certificatesOnly) {
    console.log("🔍 Mode: Certificates only");
    cleanCertificatesOnly()
      .then(() => {
        console.log("\n✅ Certificate clean operation completed!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Certificate clean operation failed:", error);
        process.exit(1);
      });
  } else {
    console.log("🔍 Mode: Full database clean");
    forceCleanDatabase()
      .then(() => {
        console.log("\n✅ Clean operation completed!");
        console.log("\n💡 Next steps:");
        console.log("1. 🦊 Connect with your wallet to MetaMask");
        console.log("2. 🔗 Deploy smart contract if needed");
        console.log(
          "3. 🌐 Visit http://localhost:3000/dashboard and start issuing new certificates"
        );
        console.log(
          "\n💡 Tip: To clean only certificates without removing users, run:"
        );
        console.log("   node scripts/clean-database.js --certificates-only");
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Clean operation failed:", error);
        process.exit(1);
      });
  }
}

module.exports = {
  cleanDatabase: forceCleanDatabase,
  cleanCertificatesOnly,
};
