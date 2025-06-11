/**
 * Clean up initial test users and keep only the deployer
 * This should be run after deployment to start fresh
 */

// Load environment variables
require("dotenv").config({ path: ".env.local" });

async function cleanInitialUsers() {
  try {
    console.log("🧹 Cleaning up initial test users...");

    // Get deployer address from environment or contract
    const deployerAddress =
      process.env.DEPLOYER_ADDRESS || process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS;

    if (!deployerAddress) {
      console.warn("⚠️ No deployer address found in environment variables.");
      console.log(
        "💡 To specify deployer address, set DEPLOYER_ADDRESS in your .env.local file"
      );
      console.log(
        "🔄 Proceeding to clean all users (you can manually add deployer later)..."
      );
    }

    // Import mysql module dynamically to handle ES module
    const mysql = await import("../utils/mysql.js");

    // Get all users
    const { data: users, error } = await mysql.getAllUsers();

    if (error) {
      throw new Error(`Failed to fetch users: ${error}`);
    }

    console.log(`📊 Found ${users.length} users in database`);

    if (users.length === 0) {
      console.log("✅ Database is already clean - no users to remove");
      return;
    }

    // Remove all users except deployer (if specified)
    let removedCount = 0;
    for (const user of users) {
      const shouldKeep =
        deployerAddress &&
        user.wallet_address.toLowerCase() === deployerAddress.toLowerCase();

      if (!shouldKeep) {
        console.log(`🗑️ Removing user: ${user.wallet_address}`);

        // Remove user activities first (foreign key constraint)
        await mysql.query("DELETE FROM activity WHERE wallet_address = ?", [
          user.wallet_address.toLowerCase(),
        ]);

        // Remove user
        await mysql.query("DELETE FROM users WHERE wallet_address = ?", [
          user.wallet_address.toLowerCase(),
        ]);

        removedCount++;
      } else {
        console.log(`✅ Keeping deployer: ${user.wallet_address}`);
      }
    }

    console.log(`\n🎉 Cleanup complete!`);
    console.log(`📊 Removed ${removedCount} test users`);
    console.log(`👤 Kept ${users.length - removedCount} users (deployer)`);

    if (!deployerAddress) {
      console.log("\n💡 Next steps:");
      console.log("1. Set DEPLOYER_ADDRESS in your .env.local file");
      console.log(
        "2. Connect with your deployer wallet to auto-add it to the system"
      );
    }

    console.log("\n✨ Your system is now ready for fresh development!");
  } catch (error) {
    console.error("❌ Failed to clean initial users:", error);
    process.exit(1);
  }
}

// Run the cleanup
if (require.main === module) {
  cleanInitialUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Cleanup failed:", error);
      process.exit(1);
    });
}

module.exports = { cleanInitialUsers };
