// Simple login simulation to debug authentication issues
import fetch from "node-fetch";

// Test wallet addresses from database
const testUsers = [
  {
    wallet: "0x241dBc6d5f283964536A94e33E2323B7580CE45A",
    role: "admin",
    username: "System Admin",
  },
  {
    wallet: "0x6ae5FfE48c1395260cF096134E5e32725c24080a",
    role: "issuer",
    username: "Test Issuer",
  },
  {
    wallet: "0x01178ee99F7E50957Ab591b0C7ca307E593254C9",
    role: "holder",
    username: "Test Holder",
  },
];

async function testLogin() {
  console.log("🔍 Testing Login API with existing users...\n");

  // Test each user
  for (const user of testUsers) {
    console.log(`🧪 Testing login for: ${user.username} (${user.role})`);
    console.log(`   Wallet: ${user.wallet}`);

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: user.wallet,
          userData: {
            username: user.username,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`   ✅ Login successful!`);
        console.log(`   Response: ${data.message}`);
        console.log(`   User ID: ${data.user?.id}`);
        console.log(`   Role: ${data.user?.role}`);
        console.log(`   Active: ${data.user?.isActive}`);

        // Extract the auth cookie from response headers
        const setCookieHeader = response.headers.get("set-cookie");
        if (setCookieHeader) {
          console.log(`   🍪 Auth cookie set successfully`);
        }
      } else {
        console.log(`   ❌ Login failed (${response.status})`);
        console.log(`   Error: ${data.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }

    console.log("-".repeat(60));
  }

  // Test verify-role endpoint
  console.log("\n🔍 Testing role verification...");

  try {
    const response = await fetch("http://localhost:3000/api/auth/verify-role", {
      method: "GET",
      headers: {
        Cookie: "auth=test", // This will fail, but we can see the error
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log("   ✅ Role verification successful");
      console.log(`   User: ${data.user?.username}`);
      console.log(`   Role: ${data.user?.role}`);
    } else {
      console.log(`   ⚠️  Role verification failed (${response.status})`);
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
  }
}

console.log(
  "Make sure your Next.js server is running on http://localhost:3000"
);
console.log("Run this after: npm run dev\n");

testLogin().catch(console.error);
