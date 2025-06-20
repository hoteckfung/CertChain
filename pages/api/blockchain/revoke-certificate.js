import { ethers } from "ethers";
import mysql from "../../../utils/mysql";
import { authenticateUser } from "../../../lib/auth-server";

// Contract ABI - just the function we need for revocation
const CONTRACT_ABI = [
  "function revokeCertificate(uint256 tokenId)",
  "function certificates(uint256 tokenId) view returns (uint256 tokenId, address recipient, address issuer, string ipfsHash, string certificateType, string recipientName, string issuerName, uint256 issueDate, bool isValid)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "event CertificateRevoked(uint256 indexed tokenId, address indexed revoker)",
];

// Role hash for ISSUER_ROLE (keccak256("ISSUER_ROLE"))
const ISSUER_ROLE =
  "0x114e74f6ea3bd819998f78687bfcb11b140da08e9b7d222fa9c1f1ba1f2aa122";

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

    // Determine if running in Docker container and choose appropriate RPC URL
    const isInDocker = process.env.DOCKER_CONTAINER === "true";
    let rpcUrl;

    if (isInDocker && process.env.SERVER_RPC_URL) {
      rpcUrl = process.env.SERVER_RPC_URL;
    } else if (process.env.NEXT_PUBLIC_RPC_URL) {
      rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    } else {
      rpcUrl = "http://127.0.0.1:7545"; // Default fallback
    }

    console.log(`🔍 Environment: ${isInDocker ? "Docker" : "Local"}`);
    console.log(`🔗 Using RPC URL: ${rpcUrl}`);
    console.log(`🔍 DOCKER_CONTAINER env: ${process.env.DOCKER_CONTAINER}`);
    console.log(`🔍 NODE_ENV: ${process.env.NODE_ENV}`);

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

    // First, verify the certificate exists and get its details
    let certificateDetails;
    try {
      certificateDetails = await contract.certificates(tokenIdNum);
      console.log("📋 Certificate details from blockchain:", {
        tokenId: Number(certificateDetails.tokenId),
        recipient: certificateDetails.recipient,
        issuer: certificateDetails.issuer,
        isValid: certificateDetails.isValid,
      });
    } catch (readError) {
      console.error(
        "❌ Failed to read certificate from blockchain:",
        readError
      );
      return res.status(400).json({
        error: "Certificate not found",
        details: "Unable to find certificate with the provided token ID",
      });
    }

    // Check if certificate exists (tokenId should not be 0)
    if (Number(certificateDetails.tokenId) === 0) {
      return res.status(404).json({
        error: "Certificate not found",
        details: "No certificate exists with the provided token ID",
      });
    }

    // Check if certificate is already revoked
    if (!certificateDetails.isValid) {
      return res.status(400).json({
        error: "Certificate already revoked",
        details: "This certificate has already been revoked",
      });
    }

    // Check if the authenticated user is the original issuer
    const userWalletAddress = user.wallet_address?.toLowerCase();
    const originalIssuer = certificateDetails.issuer?.toLowerCase();

    console.log(`👤 User wallet address: ${userWalletAddress}`);
    console.log(`🏢 Original issuer address: ${originalIssuer}`);

    if (userWalletAddress !== originalIssuer) {
      return res.status(403).json({
        error: "Unauthorized to revoke certificate",
        details: "Only the original issuer can revoke this certificate",
      });
    }

    // Check if server wallet has issuer role to perform the transaction
    let canRevoke = false;
    try {
      const hasIssuerRole = await contract.hasRole(ISSUER_ROLE, wallet.address);
      const isOriginalIssuer = wallet.address.toLowerCase() === originalIssuer;

      canRevoke = hasIssuerRole && isOriginalIssuer;

      console.log(`🔍 Server wallet has issuer role: ${hasIssuerRole}`);
      console.log(`🔍 Server wallet is original issuer: ${isOriginalIssuer}`);
      console.log(`🔍 Can revoke on blockchain: ${canRevoke}`);
    } catch (roleError) {
      console.error("❌ Failed to check server wallet roles:", roleError);
    }

    if (canRevoke) {
      // Perform blockchain revocation
      try {
        console.log("🔄 Performing blockchain revocation...");
        const tx = await contract.revokeCertificate(tokenIdNum);
        console.log(`📝 Transaction hash: ${tx.hash}`);

        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log(
          `✅ Transaction confirmed in block: ${receipt.blockNumber}`
        );

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
            console.log(
              "✅ Certificate status updated to 'Revoked' in database"
            );
          }
        } catch (dbError) {
          console.error("❌ Database update error:", dbError);
        }

        // Get certificate details for the activity log
        const { data: dbCertificateDetails } =
          await mysql.getCertificateByTokenId(tokenIdNum);
        let certificateTitle = "Unknown certificate";
        let holderWallet = "Unknown holder";

        if (dbCertificateDetails) {
          certificateTitle = dbCertificateDetails.title;
          holderWallet = dbCertificateDetails.holder_wallet;
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
          message:
            "Certificate revoked successfully on blockchain and database",
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          databaseUpdated: true,
          blockchainRevoked: true,
        });
      } catch (blockchainError) {
        console.error("❌ Blockchain revocation failed:", blockchainError);

        // Provide specific error messages for common issues
        let errorMessage = "Failed to revoke on blockchain";
        let errorDetails = blockchainError.message;

        if (
          blockchainError.message.includes("Only original issuer can revoke")
        ) {
          errorMessage =
            "Unauthorized: Server wallet is not the original issuer";
          errorDetails =
            "The server wallet does not match the original certificate issuer";
        } else if (
          blockchainError.message.includes("Certificate is already revoked")
        ) {
          errorMessage = "Certificate already revoked";
          errorDetails =
            "This certificate has already been revoked on the blockchain";
        } else if (blockchainError.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for gas";
          errorDetails = "Server wallet needs more ETH for transaction fees";
        }

        return res.status(400).json({
          error: errorMessage,
          details: errorDetails,
          blockchainRevoked: false,
        });
      }
    } else {
      // Server wallet cannot perform revocation - return instructions for frontend
      return res.status(400).json({
        error: "Server wallet cannot revoke certificate",
        details:
          "Server wallet is not the original issuer. The revocation must be performed from the frontend using the original issuer's wallet.",
        requiresFrontendRevocation: true,
        originalIssuer: originalIssuer,
        userWallet: userWalletAddress,
        canRevoke: userWalletAddress === originalIssuer,
      });
    }
  } catch (error) {
    console.error("❌ Error revoking certificate:", error);

    // Provide detailed error information for debugging
    let errorDetails = error.message;
    if (error.code) {
      errorDetails += ` (Code: ${error.code})`;
    }
    if (error.reason) {
      errorDetails += ` (Reason: ${error.reason})`;
    }

    res.status(500).json({
      error: "Failed to revoke certificate",
      details: errorDetails,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
