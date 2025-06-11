import mysql from "./mysql";

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
    return await mysql.logActivity({
      action: "CERTIFICATE_ISSUED",
      wallet_address: issuerWallet,
      target_wallet_address: holderWallet,
      details: details || "Certificate issued",
      transaction_hash: transactionHash,
      block_number: blockNumber,
      token_id: tokenId,
      ipfs_hash: ipfsHash,
      category: "certificate",
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
    return await mysql.logActivity({
      action: "CERTIFICATE_REVOKED",
      wallet_address: issuerWallet,
      target_wallet_address: holderWallet,
      details: details || "Certificate revoked",
      transaction_hash: transactionHash,
      block_number: blockNumber,
      token_id: tokenId,
      category: "certificate",
    });
  },

  // Log role changes
  async logRoleGranted(adminWallet, targetWallet, role, details) {
    return await mysql.logActivity({
      action: "ROLE_GRANTED",
      wallet_address: adminWallet,
      target_wallet_address: targetWallet,
      details: details || `${role} role granted`,
      category: "user_management",
    });
  },

  async logRoleRevoked(adminWallet, targetWallet, role, details) {
    return await mysql.logActivity({
      action: "ROLE_REVOKED",
      wallet_address: adminWallet,
      target_wallet_address: targetWallet,
      details: details || `${role} role revoked`,
      category: "user_management",
    });
  },

  // Log authentication events
  async logUserLogin(walletAddress, details) {
    return await mysql.logActivity({
      action: "USER_LOGIN",
      wallet_address: walletAddress,
      details: details || "User connected wallet",
      category: "authentication",
    });
  },

  async logUserLogout(walletAddress, details) {
    return await mysql.logActivity({
      action: "USER_LOGOUT",
      wallet_address: walletAddress,
      details: details || "User disconnected wallet",
      category: "authentication",
    });
  },

  // Log verification events
  async logVerificationPerformed(verifierWallet, ipfsHash, details) {
    return await mysql.logActivity({
      action: "VERIFICATION_PERFORMED",
      wallet_address: verifierWallet || "anonymous",
      details: details || "Certificate verification performed",
      ipfs_hash: ipfsHash,
      category: "verification",
    });
  },

  // Log contract events
  async logContractDeployed(deployerWallet, contractAddress, details) {
    return await mysql.logActivity({
      action: "CONTRACT_DEPLOYED",
      wallet_address: deployerWallet,
      details: details || `Smart contract deployed at ${contractAddress}`,
      category: "blockchain",
    });
  },

  // Generic activity logging
  async logActivity(actionType, walletAddress, details, additionalData = {}) {
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
        category: "certificate",
      },
      {
        action: "ROLE_GRANTED",
        wallet_address: "0x241d...e45a",
        target_wallet_address: "0x789a...def1",
        details: "Issuer role granted to user",
        category: "user_management",
      },
      {
        action: "VERIFICATION_PERFORMED",
        wallet_address: "anonymous",
        details: "Public certificate verification performed",
        ipfs_hash: "QmbbjgJgnSEhMJMo7WuKqt49AStkmK3Ux6qDnJwScR98Cc",
        category: "verification",
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
        category: "certificate",
      },
      {
        action: "CONTRACT_DEPLOYED",
        wallet_address: "0x241d...e45a",
        details: "CertChain contract deployed to mainnet",
        category: "blockchain",
      },
      {
        action: "USER_LOGOUT",
        wallet_address: "0x789a...def1",
        details: "User disconnected wallet",
        category: "authentication",
      },
      {
        action: "ROLE_REVOKED",
        wallet_address: "0x241d...e45a",
        target_wallet_address: "0x456b...cde2",
        details: "Issuer role revoked from inactive user",
        category: "user_management",
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
