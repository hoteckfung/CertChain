import { ethers } from "ethers";
import mysql from "./mysql";

// Contract configuration - should match your contract.js
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:7545";

// Contract ABI - events only
const CERTIFICATE_EVENTS_ABI = [
  "event CertificateIssued(uint256 indexed tokenId, address indexed recipient, address indexed issuer, string ipfsHash, string certificateType)",
  "event CertificateRevoked(uint256 indexed tokenId, address indexed revoker)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

let eventListeners = null;
let isListening = false;

/**
 * Start listening for blockchain events and sync to database
 */
export function startBlockchainSync() {
  if (isListening) {
    console.log("🔄 Blockchain sync already running");
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CERTIFICATE_EVENTS_ABI,
      provider
    );

    console.log("🚀 Starting blockchain event listeners...");
    console.log("📄 Contract:", CONTRACT_ADDRESS);
    console.log("🌐 RPC:", RPC_URL);

    // Listen for certificate issuance
    contract.on(
      "CertificateIssued",
      async (tokenId, recipient, issuer, ipfsHash, certificateType, event) => {
        console.log("📜 Certificate issued event:", {
          tokenId: tokenId.toString(),
          recipient,
          issuer,
          ipfsHash,
          certificateType,
        });

        try {
          // Sync to database
          await syncCertificateIssuance({
            tokenId: tokenId.toString(),
            recipient,
            issuer,
            ipfsHash,
            certificateType,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
          });
        } catch (error) {
          console.error("❌ Failed to sync certificate issuance:", error);
        }
      }
    );

    // Listen for certificate revocation
    contract.on("CertificateRevoked", async (tokenId, revoker, event) => {
      console.log("🚫 Certificate revoked event:", {
        tokenId: tokenId.toString(),
        revoker,
      });

      try {
        // Sync to database
        await syncCertificateRevocation({
          tokenId: tokenId.toString(),
          revoker,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
        });
      } catch (error) {
        console.error("❌ Failed to sync certificate revocation:", error);
      }
    });

    // Listen for transfers (ownership changes)
    contract.on("Transfer", async (from, to, tokenId, event) => {
      // Skip minting events (from = 0x0)
      if (from === ethers.ZeroAddress) return;

      console.log("🔄 Certificate transfer event:", {
        from,
        to,
        tokenId: tokenId.toString(),
      });

      try {
        // Sync to database
        await syncCertificateTransfer({
          tokenId: tokenId.toString(),
          from,
          to,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
        });
      } catch (error) {
        console.error("❌ Failed to sync certificate transfer:", error);
      }
    });

    // Store event listeners for cleanup
    eventListeners = {
      contract,
      provider,
    };

    isListening = true;
    console.log("✅ Blockchain event listeners started successfully");

    // Test connection
    provider
      .getBlockNumber()
      .then((blockNumber) => {
        console.log("📊 Current block number:", blockNumber);
      })
      .catch((error) => {
        console.error("⚠️ Connection test failed:", error.message);
      });
  } catch (error) {
    console.error("❌ Failed to start blockchain sync:", error);
    isListening = false;
  }
}

/**
 * Stop blockchain event listeners
 */
export function stopBlockchainSync() {
  if (!isListening || !eventListeners) {
    console.log("⏹️ Blockchain sync not running");
    return;
  }

  try {
    eventListeners.contract.removeAllListeners();
    eventListeners.provider.destroy();
    eventListeners = null;
    isListening = false;
    console.log("🛑 Blockchain event listeners stopped");
  } catch (error) {
    console.error("❌ Error stopping blockchain sync:", error);
  }
}

/**
 * Sync certificate issuance to database
 */
async function syncCertificateIssuance({
  tokenId,
  recipient,
  issuer,
  ipfsHash,
  certificateType,
  transactionHash,
  blockNumber,
}) {
  try {
    // Get or create users in database
    const issuerUser = await getOrCreateUser(issuer);
    const recipientUser = await getOrCreateUser(recipient);

    // Insert/update certificate in database
    const certificateData = {
      token_id: tokenId,
      ipfs_hash: ipfsHash,
      issuer_id: issuerUser.id,
      holder_id: recipientUser.id,
      title: certificateType || "Certificate",
      description: `Certificate issued on blockchain`,
      issue_date: new Date(),
      status: "issued",
    };

    // Check if certificate already exists
    const { data: existingCert } = await mysql.query(
      "SELECT id FROM certificates WHERE token_id = ? OR ipfs_hash = ?",
      [tokenId, ipfsHash]
    );

    if (existingCert && existingCert.length > 0) {
      // Update existing certificate
      await mysql.query(
        "UPDATE certificates SET status = 'issued' WHERE token_id = ?",
        [tokenId]
      );
      console.log("📝 Updated existing certificate in database");
    } else {
      // Insert new certificate
      await mysql.query(
        `INSERT INTO certificates 
         (token_id, ipfs_hash, issuer_id, holder_id, title, description, issue_date, status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          certificateData.token_id,
          certificateData.ipfs_hash,
          certificateData.issuer_id,
          certificateData.holder_id,
          certificateData.title,
          certificateData.description,
          certificateData.issue_date,
          certificateData.status,
        ]
      );
      console.log("📝 Inserted new certificate into database");
    }

    // Log activity
    await mysql.logActivity({
      user_id: issuerUser.id,
      action: "certificate_issued",
      entity_type: "certificate",
      entity_id: tokenId,
      details: `Certificate issued to ${recipient}`,
      wallet_address: issuer,
      target_wallet_address: recipient,
      certificate_id: null, // Will be filled by trigger
      token_id: tokenId,
      ipfs_hash: ipfsHash,
      transaction_hash: transactionHash,
      block_number: blockNumber,
      category: "certificate_management",
    });
  } catch (error) {
    console.error("❌ Database sync error (issuance):", error);
    throw error;
  }
}

/**
 * Sync certificate revocation to database
 */
async function syncCertificateRevocation({
  tokenId,
  revoker,
  transactionHash,
  blockNumber,
}) {
  try {
    // Update certificate status
    await mysql.query(
      "UPDATE certificates SET status = 'revoked' WHERE token_id = ?",
      [tokenId]
    );

    // Get revoker user
    const revokerUser = await getOrCreateUser(revoker);

    // Log activity
    await mysql.logActivity({
      user_id: revokerUser.id,
      action: "certificate_revoked",
      entity_type: "certificate",
      entity_id: tokenId,
      details: `Certificate revoked by ${revoker}`,
      wallet_address: revoker,
      token_id: tokenId,
      transaction_hash: transactionHash,
      block_number: blockNumber,
      category: "certificate_management",
    });

    console.log("📝 Certificate revoked in database");
  } catch (error) {
    console.error("❌ Database sync error (revocation):", error);
    throw error;
  }
}

/**
 * Sync certificate transfer to database
 */
async function syncCertificateTransfer({
  tokenId,
  from,
  to,
  transactionHash,
  blockNumber,
}) {
  try {
    // Get users
    const fromUser = await getOrCreateUser(from);
    const toUser = await getOrCreateUser(to);

    // Update certificate holder
    await mysql.query(
      "UPDATE certificates SET holder_id = ? WHERE token_id = ?",
      [toUser.id, tokenId]
    );

    // Log activity
    await mysql.logActivity({
      user_id: fromUser.id,
      action: "certificate_transferred",
      entity_type: "certificate",
      entity_id: tokenId,
      details: `Certificate transferred from ${from} to ${to}`,
      wallet_address: from,
      target_wallet_address: to,
      token_id: tokenId,
      transaction_hash: transactionHash,
      block_number: blockNumber,
      category: "certificate_management",
    });

    console.log("📝 Certificate transfer synced to database");
  } catch (error) {
    console.error("❌ Database sync error (transfer):", error);
    throw error;
  }
}

/**
 * Get or create user in database
 */
async function getOrCreateUser(walletAddress) {
  try {
    // Try to get existing user
    const { data: existingUser } = await mysql.getUserByWalletAddress(
      walletAddress
    );

    if (existingUser) {
      return existingUser;
    }

    // Create new user with default holder role (blockchain is source of truth for roles)
    const userData = {
      wallet_address: walletAddress.toLowerCase(),
      role: "holder", // Default, actual role comes from blockchain
      permissions: JSON.stringify(["view_certificates"]),
    };

    const { data: newUser } = await mysql.createUser(userData);
    console.log("👤 Created new user in database:", walletAddress);

    return newUser;
  } catch (error) {
    console.error("❌ Failed to get/create user:", error);
    throw error;
  }
}

/**
 * Check if blockchain sync is running
 */
export function isBlockchainSyncRunning() {
  return isListening;
}

/**
 * Get sync status
 */
export function getBlockchainSyncStatus() {
  return {
    isRunning: isListening,
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL,
    startedAt: isListening ? new Date().toISOString() : null,
  };
}
