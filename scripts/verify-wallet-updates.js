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

async function verifyWalletUpdates() {
  console.log("✅ Wallet Address Update Verification\n");

  const env = loadEnv();
  const config = {
    host: env.MYSQL_HOST || "localhost",
    port: parseInt(env.MYSQL_PORT) || 3306,
    user: env.MYSQL_USER || "root",
    password: env.MYSQL_PASSWORD || "mysql",
    database: env.MYSQL_DATABASE || "certchain",
  };

  // Expected wallet assignments
  const expectedWallets = {
    admin: "0x241dBc6d5f283964536A94e33E2323B7580CE45A",
    issuer: "0x6ae5FfE48c1395260cF096134E5e32725c24080a",
    holder: "0x01178ee99F7E50957Ab591b0C7ca307E593254C9",
  };

  console.log("🎯 Expected Wallet Assignments:");
  console.log(`   Admin:  ${expectedWallets.admin}`);
  console.log(`   Issuer: ${expectedWallets.issuer}`);
  console.log(`   Holder: ${expectedWallets.holder}\n`);

  let connection;

  try {
    connection = await mysql.createConnection(config);
    console.log("✅ Connected to database\n");

    // Check current database state
    console.log("📊 Current Database State:");
    const [users] = await connection.execute(`
      SELECT id, username, role, wallet_address, is_active 
      FROM users 
      WHERE role IN ('admin', 'issuer', 'holder')
      ORDER BY 
        CASE role 
          WHEN 'admin' THEN 1 
          WHEN 'issuer' THEN 2 
          WHEN 'holder' THEN 3 
        END, 
        created_at
    `);

    let adminFound = false;
    let issuerFound = false;
    let holderFound = false;

    users.forEach((user) => {
      const status = user.is_active ? "✅" : "❌";
      const isExpected =
        expectedWallets[user.role] &&
        expectedWallets[user.role].toLowerCase() ===
          user.wallet_address.toLowerCase();
      const badge = isExpected ? "🎯" : "⚠️";

      console.log(`   ${status} ${badge} ${user.username} (${user.role})`);
      console.log(`     Wallet: ${user.wallet_address}`);

      if (isExpected) {
        if (user.role === "admin") adminFound = true;
        if (user.role === "issuer") issuerFound = true;
        if (user.role === "holder") holderFound = true;
      }
    });

    console.log("\n🔍 Verification Results:");
    console.log(`   Admin wallet match:  ${adminFound ? "✅" : "❌"}`);
    console.log(`   Issuer wallet match: ${issuerFound ? "✅" : "❌"}`);
    console.log(`   Holder wallet match: ${holderFound ? "✅" : "❌"}`);

    // Test login simulation for each role
    console.log("\n🧪 Login Test Simulation:");

    for (const [role, wallet] of Object.entries(expectedWallets)) {
      const [userCheck] = await connection.execute(
        "SELECT id, username, role, is_active FROM users WHERE LOWER(wallet_address) = LOWER(?) LIMIT 1",
        [wallet]
      );

      if (userCheck.length > 0) {
        const user = userCheck[0];
        const canLogin = user.is_active && user.role === role;
        console.log(
          `   ${
            canLogin ? "✅" : "❌"
          } ${role.toUpperCase()} login: ${wallet.substring(0, 10)}...`
        );
        console.log(
          `     User: ${user.username}, Role: ${user.role}, Active: ${
            user.is_active ? "Yes" : "No"
          }`
        );
      } else {
        console.log(
          `   ❌ ${role.toUpperCase()} login: ${wallet.substring(
            0,
            10
          )}... (User not found)`
        );
      }
    }

    // Success summary
    const allMatched = adminFound && issuerFound && holderFound;
    console.log("\n" + "=".repeat(60));

    if (allMatched) {
      console.log("🎉 SUCCESS: All wallet addresses updated correctly!");
      console.log("\n📋 You can now test login with these wallets:");
      console.log(`   Admin:  ${expectedWallets.admin}`);
      console.log(`   Issuer: ${expectedWallets.issuer}`);
      console.log(`   Holder: ${expectedWallets.holder}`);
      console.log("\n💡 Next steps:");
      console.log(
        "   1. Make sure MetaMask is connected to one of these wallets"
      );
      console.log("   2. Visit http://localhost:3000/login");
      console.log('   3. Click "Connect with MetaMask"');
      console.log("   4. You should be redirected to your role dashboard");
    } else {
      console.log(
        "⚠️  WARNING: Some wallet addresses may not be set correctly"
      );
      console.log("   Please check the database manually if needed");
    }
  } catch (error) {
    console.error("❌ Verification failed:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the verification
verifyWalletUpdates().catch(console.error);
