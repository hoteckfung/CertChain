import { ethers } from "ethers";
import mysql from "../../../utils/mysql";
import { authenticateUser } from "../../../lib/auth-server";

// Contract ABI - just the function we need for revocation
const CONTRACT_ABI = [
  "function revokeCertificate(uint256 tokenId)",
  "event CertificateRevoked(uint256 indexed tokenId, address indexed revoker)",
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Authenticate user
    const { user, error: authError } = await authenticateUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { tokenId } = req.body;

    // Validate input
    if (!tokenId) {
      return res.status(400).json({
        error: "Token ID is required",
      });
    }

    const tokenIdNum = parseInt(tokenId);
    if (isNaN(tokenIdNum) || tokenIdNum <= 0) {
      return res.status(400).json({
        error: "Invalid token ID format",
      });
    }

    // Get environment variables
    const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";

    if (!privateKey) {
      return res.status(500).json({
        error: "Server wallet not configured",
        details: "SERVER_WALLET_PRIVATE_KEY environment variable is missing",
      });
    }

    if (!contractAddress || contractAddress === "0x...") {
      return res.status(500).json({
        error: "Contract not configured",
        details:
          "NEXT_PUBLIC_CONTRACT_ADDRESS environment variable is missing or invalid",
      });
    }

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Get contract instance
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);

    console.log(
      `🔐 Attempting to revoke certificate with token ID: ${tokenIdNum}`
    );
    console.log(`🔗 Using contract at address: ${contractAddress}`);
    console.log(`👤 Server wallet address: ${wallet.address}`);

    // Call the revoke function
    const tx = await contract.revokeCertificate(tokenIdNum);
    console.log(`📝 Transaction hash: ${tx.hash}`);

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);

    // Update certificate status in database
    try {
      const { error: updateError } =
        await mysql.updateCertificateStatusByTokenId(tokenIdNum, "Revoked");
      if (updateError) {
        console.error(
          "❌ Failed to update certificate status in database:",
          updateError
        );
      } else {
        console.log("✅ Certificate status updated to 'Revoked' in database");
      }
    } catch (dbError) {
      console.error("❌ Database update error:", dbError);
    }

    // Get certificate details for the activity log
    const { data: certificateDetails } = await mysql.getCertificateByTokenId(
      tokenIdNum
    );
    let certificateTitle = "Unknown certificate";
    let holderWallet = "Unknown holder";

    if (certificateDetails) {
      certificateTitle = certificateDetails.title;
      holderWallet = certificateDetails.holder_wallet;
    }

    // Log the certificate revocation activity
    try {
      await mysql.logActivity({
        user_id: user.id,
        action: "CERTIFICATE_REVOKED",
        details: `Certificate "${certificateTitle}" revoked from ${holderWallet}`,
        wallet_address: user.wallet_address,
        token_id: tokenIdNum,
        transaction_hash: tx.hash,
        block_number: receipt.blockNumber,
        category: "certificate_management",
      });
      console.log("✅ Certificate revocation activity logged successfully");
    } catch (logError) {
      console.error(
        "❌ Failed to log certificate revocation activity:",
        logError
      );
    }

    res.status(200).json({
      success: true,
      message: "Certificate revoked successfully",
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("Error revoking certificate:", error);
    res.status(500).json({
      error: "Failed to revoke certificate",
      details: error.message,
    });
  }
}
