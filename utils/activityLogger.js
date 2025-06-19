import mysql from "./mysql";

// Helper function to check if user is admin and should be excluded from logging
const shouldSkipLogging = async (walletAddress) => {
  if (!walletAddress || walletAddress === "anonymous") return false;

  try {
    const { data: user } = await mysql.getUserByWalletAddress(walletAddress);
    return user && user.role === "admin";
  } catch (error) {
    // If we can't determine the role, log the activity to be safe
    console.warn("Failed to check user role for activity logging:", error);
    return false;
  }
};

// Activity logging utility
export const ActivityLogger = {
  // Log certificate issuance
  async logCertificateIssued(
    issuerWallet,
    holderWallet,
    details,
    transactionHash,
    blockNumber,
    tokenId,
    ipfsHash
  ) {
    // Skip logging if issuer is admin
    if (await shouldSkipLogging(issuerWallet)) {
      return { success: true, skipped: true, reason: "Admin action excluded" };
    }

    return await mysql.logActivity({
      action: "CERTIFICATE_ISSUED",
      wallet_address: issuerWallet,
      target_wallet_address: holderWallet,
      details: details || "Certificate issued",
      transaction_hash: transactionHash,
      block_number: blockNumber,
      token_id: tokenId,
      ipfs_hash: ipfsHash,
      category: "certificate_management",
    });
  },

  // Log certificate revocation
  async logCertificateRevoked(
    issuerWallet,
    holderWallet,
    details,
    transactionHash,
    blockNumber,
    tokenId
  ) {
    // Skip logging if issuer is admin
    if (await shouldSkipLogging(issuerWallet)) {
      return { success: true, skipped: true, reason: "Admin action excluded" };
    }

    return await mysql.logActivity({
      action: "CERTIFICATE_REVOKED",
      wallet_address: issuerWallet,
      target_wallet_address: holderWallet,
      details: details || "Certificate revoked",
      transaction_hash: transactionHash,
      block_number: blockNumber,
      token_id: tokenId,
      category: "certificate_management",
    });
  },

  // Log authentication events
  async logUserLogin(walletAddress, details) {
    // Skip logging if user is admin
    if (await shouldSkipLogging(walletAddress)) {
      return { success: true, skipped: true, reason: "Admin action excluded" };
    }

    return await mysql.logActivity({
      action: "USER_LOGIN",
      wallet_address: walletAddress,
      details: details || "User logged in successfully.",
      category: "authentication",
    });
  },

  // logUserLogout removed per user request

  // Log verification events
  async logVerificationPerformed(verifierWallet, ipfsHash, details) {
    // Skip logging if verifier is admin (but allow anonymous verifications)
    if (
      verifierWallet !== "anonymous" &&
      (await shouldSkipLogging(verifierWallet))
    ) {
      return { success: true, skipped: true, reason: "Admin action excluded" };
    }

    return await mysql.logActivity({
      action: "VERIFICATION_PERFORMED",
      wallet_address: verifierWallet || "anonymous",
      details: details || "Certificate verification performed",
      ipfs_hash: ipfsHash,
      category: "system_event",
    });
  },

  // Log contract events
  async logContractDeployed(deployerWallet, contractAddress, details) {
    // Skip logging if deployer is admin
    if (await shouldSkipLogging(deployerWallet)) {
      return { success: true, skipped: true, reason: "Admin action excluded" };
    }

    return await mysql.logActivity({
      action: "CONTRACT_DEPLOYED",
      wallet_address: deployerWallet,
      details: details || `Smart contract deployed at ${contractAddress}`,
      category: "blockchain_interaction",
    });
  },

  // Generic activity logging
  async logActivity(actionType, walletAddress, details, additionalData = {}) {
    // Skip logging if user is admin
    if (await shouldSkipLogging(walletAddress)) {
      return { success: true, skipped: true, reason: "Admin action excluded" };
    }

    return await mysql.logActivity({
      action: actionType,
      wallet_address: walletAddress,
      details: details,
      category: additionalData.category || "system_event",
      ...additionalData,
    });
  },

  // Create sample data for testing
  async createSampleData() {
    const sampleActivities = [
      {
        action: "CERTIFICATE_ISSUED",
        wallet_address: "0x241d...e45a",
        target_wallet_address: "0x789a...def1",
        details: "Blockchain Development Certificate issued",
        token_id: 1,
        ipfs_hash: "QmbbjgJgnSEhMJMo7WuKqt49AStkmK3Ux6qDnJwScR98Cc",
        transaction_hash: "0x1234567890abcdef1234567890abcdef12345678",
        block_number: 18450123,
        category: "certificate_management",
      },
      {
        action: "VERIFICATION_PERFORMED",
        wallet_address: "anonymous",
        details: "Public certificate verification performed",
        ipfs_hash: "QmbbjgJgnSEhMJMo7WuKqt49AStkmK3Ux6qDnJwScR98Cc",
        category: "system_event",
      },
      {
        action: "USER_LOGIN",
        wallet_address: "0x241d...e45a",
        details: "Admin user connected wallet",
        category: "authentication",
      },
      {
        action: "CERTIFICATE_REVOKED",
        wallet_address: "0x241d...e45a",
        target_wallet_address: "0x789a...def1",
        details: "Certificate revoked due to policy violation",
        token_id: 2,
        transaction_hash: "0xabcdef1234567890abcdef1234567890abcdef12",
        block_number: 18450124,
        category: "certificate_management",
      },
      {
        action: "CONTRACT_DEPLOYED",
        wallet_address: "0x241d...e45a",
        details: "CertChain contract deployed to mainnet",
        category: "blockchain_interaction",
      },
    ];

    const results = [];
    for (const activity of sampleActivities) {
      const result = await mysql.logActivity(activity);
      results.push(result);
    }

    return results;
  },
};

export default ActivityLogger;
