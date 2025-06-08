import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

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

async function debugAuthenticationFlow() {
  console.log("🔍 Complete Authentication Flow Debug\n");
  console.log("=" + "=".repeat(50));

  const env = loadEnv();
  const config = {
    host: env.MYSQL_HOST || "localhost",
    port: parseInt(env.MYSQL_PORT) || 3306,
    user: env.MYSQL_USER || "root",
    password: env.MYSQL_PASSWORD || "mysql",
    database: env.MYSQL_DATABASE || "certchain",
  };

  // Test wallets
  const testWallets = {
    admin: "0x241dBc6d5f283964536A94e33E2323B7580CE45A",
    issuer: "0x6ae5FfE48c1395260cF096134E5e32725c24080a",
    holder: "0x01178ee99F7E50957Ab591b0C7ca307E593254C9",
  };

  let connection;

  try {
    // Step 1: Test Database Connection
    console.log("\n📊 Step 1: Database Connection Test");
    connection = await mysql.createConnection(config);
    console.log("✅ Database connected successfully");

    // Step 2: Check User Data
    console.log("\n👥 Step 2: User Data Verification");
    for (const [role, wallet] of Object.entries(testWallets)) {
      const [users] = await connection.execute(
        "SELECT id, username, role, wallet_address, is_active FROM users WHERE LOWER(wallet_address) = LOWER(?)",
        [wallet]
      );

      if (users.length > 0) {
        const user = users[0];
        console.log(
          `✅ ${role.toUpperCase()}: ${user.username} (ID: ${
            user.id
          }, Active: ${user.is_active ? "Yes" : "No"})`
        );
      } else {
        console.log(
          `❌ ${role.toUpperCase()}: User not found for wallet ${wallet}`
        );
      }
    }

    // Step 3: Test Next.js Server Connectivity
    console.log("\n🌐 Step 3: Next.js Server Test");

    const serverUrls = ["http://localhost:3000", "http://localhost:3001"];

    let workingUrl = null;

    for (const url of serverUrls) {
      try {
        const response = await fetch(`${url}/api/db-test`, {
          timeout: 3000,
        });
        if (response.ok) {
          workingUrl = url;
          console.log(`✅ Server running at: ${url}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Server not responding at: ${url}`);
      }
    }

    if (!workingUrl) {
      console.log("❌ No Next.js server found running");
      console.log("💡 Please run: npm run dev");
      return;
    }

    // Step 4: Test Database API
    console.log("\n🔌 Step 4: Database API Test");
    try {
      const dbTestResponse = await fetch(`${workingUrl}/api/db-test`);
      const dbTestData = await dbTestResponse.json();

      if (dbTestResponse.ok) {
        console.log(
          `✅ Database API working (${dbTestData.userCount} users found)`
        );
      } else {
        console.log(`❌ Database API error: ${dbTestData.error}`);
      }
    } catch (error) {
      console.log(`❌ Database API request failed: ${error.message}`);
    }

    // Step 5: Test Login API for Each Role
    console.log("\n🔐 Step 5: Login API Test");

    for (const [role, wallet] of Object.entries(testWallets)) {
      console.log(`\n--- Testing ${role.toUpperCase()} Login ---`);

      try {
        const loginResponse = await fetch(`${workingUrl}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletAddress: wallet,
            userData: {
              username: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
            },
          }),
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok && loginData.success) {
          console.log(`✅ Login successful for ${role}`);
          console.log(`   User ID: ${loginData.user?.id}`);
          console.log(`   Role: ${loginData.user?.role}`);
          console.log(`   Active: ${loginData.user?.isActive}`);

          // Extract cookies for role verification test
          const cookies = loginResponse.headers.get("set-cookie");
          if (cookies) {
            console.log(`   🍪 Auth cookie set`);

            // Test role verification with the cookie
            try {
              const verifyResponse = await fetch(
                `${workingUrl}/api/auth/verify-role`,
                {
                  headers: {
                    Cookie: cookies,
                  },
                }
              );

              const verifyData = await verifyResponse.json();

              if (verifyResponse.ok && verifyData.authenticated) {
                console.log(`   ✅ Role verification successful`);
                console.log(`   Redirect to: ${verifyData.redirectTo}`);
              } else {
                console.log(
                  `   ❌ Role verification failed: ${verifyData.error}`
                );
              }
            } catch (verifyError) {
              console.log(
                `   ❌ Role verification request failed: ${verifyError.message}`
              );
            }
          } else {
            console.log(
              `   ⚠️  No auth cookie set - this could be the problem`
            );
          }
        } else {
          console.log(
            `❌ Login failed for ${role}: ${loginData.error || "Unknown error"}`
          );
        }
      } catch (error) {
        console.log(`❌ Login request failed for ${role}: ${error.message}`);
      }
    }

    // Step 6: Test Page Access
    console.log("\n📄 Step 6: Role Page Access Test");
    const rolePages = {
      admin: "/admin",
      issuer: "/issuer",
      holder: "/holder",
    };

    for (const [role, page] of Object.entries(rolePages)) {
      try {
        const pageResponse = await fetch(`${workingUrl}${page}`, {
          redirect: "manual", // Don't follow redirects
        });

        console.log(
          `${role.toUpperCase()} page (${page}): Status ${pageResponse.status}`
        );

        if (pageResponse.status === 302 || pageResponse.status === 307) {
          const location = pageResponse.headers.get("location");
          console.log(`   → Redirected to: ${location}`);
        }
      } catch (error) {
        console.log(`❌ Failed to test ${role} page: ${error.message}`);
      }
    }

    // Step 7: Recommendations
    console.log("\n💡 Step 7: Troubleshooting Recommendations");
    console.log("=" + "=".repeat(50));

    console.log("\n🔧 Common Issues & Solutions:");
    console.log("");
    console.log("1. 🍪 COOKIE ISSUES:");
    console.log("   - Clear browser cookies and localStorage");
    console.log("   - Try incognito/private browsing mode");
    console.log("   - Check if cookies are enabled");
    console.log("");
    console.log("2. 🔗 METAMASK CONNECTION:");
    console.log("   - Make sure MetaMask is unlocked");
    console.log("   - Verify you're using the correct wallet address");
    console.log("   - Try disconnecting and reconnecting MetaMask");
    console.log("");
    console.log("3. 🔄 REDIRECT ISSUES:");
    console.log("   - Check browser console for JavaScript errors");
    console.log("   - Verify middleware.js is working correctly");
    console.log("   - Try manually navigating to role pages");
    console.log("");
    console.log("4. 🎯 TESTING STEPS:");
    console.log("   - Use browser DevTools → Application → Cookies");
    console.log('   - Check for "auth" cookie after login');
    console.log("   - Monitor Network tab for API calls");
    console.log("   - Look for errors in browser Console");
  } catch (error) {
    console.error("❌ Debug test failed:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the debug
debugAuthenticationFlow().catch(console.error);
