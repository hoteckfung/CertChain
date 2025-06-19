import { ethers } from "ethers";
import { isUserRejectionError } from "./errorHandling";

// Contract ABI - you'll get this after compilation
const CERTIFICATE_NFT_ABI = [
  // Core functions
  "function issueCertificate(address recipient, string ipfsHash, string certificateType, string recipientName, string issuerName) returns (uint256)",
  "function verifyCertificate(string ipfsHash) view returns (bool exists, bool isValid, tuple(uint256 tokenId, address recipient, address issuer, string ipfsHash, string certificateType, string recipientName, string issuerName, uint256 issueDate, bool isValid) certificate)",
  "function verifyCertificateById(uint256 tokenId) view returns (bool exists, bool isValid, tuple(uint256 tokenId, address recipient, address issuer, string ipfsHash, string certificateType, string recipientName, string issuerName, uint256 issueDate, bool isValid) certificate)",
  "function getUserCertificates(address user) view returns (tuple(uint256 tokenId, address recipient, address issuer, string ipfsHash, string certificateType, string recipientName, string issuerName, uint256 issueDate, bool isValid)[])",
  "function getUserCertificateCount(address user) view returns (uint256)",
  "function revokeCertificate(uint256 tokenId)",
  "function getTotalCertificates() view returns (uint256)",

  // Role management
  "function grantIssuerRole(address account)",
  "function revokeIssuerRole(address account)",
  "function isIssuer(address account) view returns (bool)",
  "function isAdmin(address account) view returns (bool)",

  // ERC721 functions
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",

  // Admin functions
  "function pause()",
  "function unpause()",
  "function paused() view returns (bool)",

  // Events
  "event CertificateIssued(uint256 indexed tokenId, address indexed recipient, address indexed issuer, string ipfsHash, string certificateType)",
  "event CertificateRevoked(uint256 indexed tokenId, address indexed revoker)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

// Contract configuration
const CONTRACT_CONFIG = {
  // Update these after deployment
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x...", // Deploy and set this
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID || 31337, // Hardhat local by default
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545",
  // Server-side RPC URL for Docker environments
  serverRpcUrl:
    process.env.SERVER_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_URL ||
    "http://127.0.0.1:8545",
};

/**
 * Get contract instance for read operations
 * Uses server-side RPC URL when running on server, client-side when in browser
 */
export function getContractRead() {
  // Determine if we're running on server or client
  const isServer = typeof window === "undefined";
  const rpcUrl = isServer
    ? CONTRACT_CONFIG.serverRpcUrl
    : CONTRACT_CONFIG.rpcUrl;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Contract(
    CONTRACT_CONFIG.address,
    CERTIFICATE_NFT_ABI,
    provider
  );
}

/**
 * Get contract instance for write operations
 * Requires MetaMask or similar wallet connection
 */
export async function getContractWrite() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error(
      "MetaMask not found. Please install MetaMask to interact with the contract."
    );
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(
    CONTRACT_CONFIG.address,
    CERTIFICATE_NFT_ABI,
    signer
  );
}

/**
 * Issue a certificate on the blockchain
 */
export async function issueCertificateOnChain({
  recipientAddress,
  ipfsHash,
  certificateType,
  recipientName,
  issuerName,
}) {
  try {
    console.log("🔍 DEBUG: Getting contract for writing...");
    const contract = await getContractWrite();

    console.log("🔍 DEBUG: Contract obtained:", {
      contractAddress: await contract.getAddress(),
      signer: await contract.runner.getAddress(),
    });

    // Check if the current user has ISSUER_ROLE before attempting transaction
    console.log("🔍 DEBUG: Checking ISSUER_ROLE...");
    const signerAddress = await contract.runner.getAddress();
    const hasIssuerRole = await contract.isIssuer(signerAddress);
    console.log("🔍 DEBUG: Has ISSUER_ROLE:", hasIssuerRole);

    if (!hasIssuerRole) {
      throw new Error(
        "Account does not have ISSUER_ROLE. Please contact an admin to grant you issuer permissions."
      );
    }

    // Check if contract is paused
    console.log("🔍 DEBUG: Checking if contract is paused...");
    const isPaused = await contract.paused();
    console.log("🔍 DEBUG: Contract paused:", isPaused);

    if (isPaused) {
      throw new Error(
        "Certificate issuance is currently paused. Please contact an admin to unpause the contract."
      );
    }

    // Validate parameters
    console.log("🔍 DEBUG: Validating parameters...", {
      recipientAddress,
      ipfsHash,
      certificateType,
      recipientName,
      issuerName,
    });

    if (
      !recipientAddress ||
      !ipfsHash ||
      !certificateType ||
      !recipientName ||
      !issuerName
    ) {
      throw new Error("Missing required parameters for certificate issuance");
    }

    // Check if certificate with this IPFS hash already exists
    console.log("🔍 DEBUG: Checking if certificate already exists...");
    try {
      const [exists] = await contract.verifyCertificate(ipfsHash);
      if (exists) {
        throw new Error("A certificate with this IPFS hash already exists");
      }
    } catch (verifyError) {
      console.log(
        "🔍 DEBUG: Verify check failed (this might be normal):",
        verifyError.message
      );
    }

    console.log("🔍 DEBUG: Attempting to estimate gas...");
    try {
      const gasEstimate = await contract.issueCertificate.estimateGas(
        recipientAddress,
        ipfsHash,
        certificateType,
        recipientName,
        issuerName
      );
      console.log("🔍 DEBUG: Gas estimate successful:", gasEstimate.toString());
    } catch (gasError) {
      console.error("❌ DEBUG: Gas estimation failed:", gasError);
      throw new Error(
        `Transaction would fail: ${gasError.reason || gasError.message}`
      );
    }

    console.log("🔍 DEBUG: Sending transaction...");

    let tx;
    try {
      tx = await contract.issueCertificate(
        recipientAddress,
        ipfsHash,
        certificateType,
        recipientName,
        issuerName
      );
      console.log("Transaction submitted:", tx.hash);
    } catch (txError) {
      console.error("Error during transaction submission:", txError);

      if (isUserRejectionError(txError)) {
        return {
          success: false,
          error: "Transaction was rejected by user.",
          userRejected: true,
        };
      }

      throw txError;
    }

    let receipt;
    try {
      receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
    } catch (waitError) {
      console.error("Error during transaction waiting:", waitError);

      if (isUserRejectionError(waitError)) {
        return {
          success: false,
          error: "Transaction was rejected by user.",
          userRejected: true,
        };
      }

      throw waitError;
    }

    // Extract token ID from the CertificateIssued event
    let tokenId = null;

    try {
      // Parse the logs to find the CertificateIssued event
      const certificateIssuedEvent = receipt.logs.find((log) => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog.name === "CertificateIssued";
        } catch (e) {
          return false;
        }
      });

      if (certificateIssuedEvent) {
        const parsedLog = contract.interface.parseLog(certificateIssuedEvent);
        tokenId = Number(parsedLog.args.tokenId);
        console.log("✅ DEBUG: Extracted tokenId from event:", tokenId);
      } else {
        console.warn("⚠️ DEBUG: CertificateIssued event not found in logs");
        // Fallback: try to get the latest token ID from the contract
        const totalCertificates = await contract.getTotalCertificates();
        tokenId = Number(totalCertificates);
        console.log("✅ DEBUG: Using total certificates as tokenId:", tokenId);
      }
    } catch (eventParseError) {
      console.error("❌ DEBUG: Error parsing event:", eventParseError);
      // Fallback: try to get the latest token ID from the contract
      try {
        const totalCertificates = await contract.getTotalCertificates();
        tokenId = Number(totalCertificates);
        console.log(
          "✅ DEBUG: Fallback - using total certificates as tokenId:",
          tokenId
        );
      } catch (fallbackError) {
        console.error("❌ DEBUG: Fallback also failed:", fallbackError);
        tokenId = 0; // Last resort
      }
    }

    return {
      success: true,
      tokenId,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("❌ DEBUG: Full error details:", {
      message: error.message,
      code: error.code,
      reason: error.reason,
      data: error.data,
      stack: error.stack,
    });

    // Check for user rejection first
    if (isUserRejectionError(error)) {
      return {
        success: false,
        error: "Transaction was rejected by user.",
        userRejected: true,
      };
    }

    // Provide more user-friendly error messages for other errors
    let userFriendlyMessage = error.message;

    if (error.code === "CALL_EXCEPTION") {
      userFriendlyMessage =
        "Smart contract call failed. This could be due to insufficient permissions or invalid parameters.";
    } else if (error.message.includes("missing revert data")) {
      userFriendlyMessage =
        "Transaction failed during gas estimation. Please check your wallet connection and permissions.";
    } else if (error.message.includes("insufficient funds")) {
      userFriendlyMessage =
        "Insufficient ETH for gas fees. Please add more ETH to your wallet.";
    }

    return {
      success: false,
      error: userFriendlyMessage,
    };
  }
}

/**
 * Verify a certificate by IPFS hash
 */
export async function verifyCertificateByHash(ipfsHash) {
  try {
    const contract = getContractRead();
    const [exists, isValid, certificate] = await contract.verifyCertificate(
      ipfsHash
    );

    return {
      success: true,
      exists,
      isValid,
      certificate: exists
        ? {
            tokenId: certificate.tokenId.toString(),
            recipient: certificate.recipient,
            issuer: certificate.issuer,
            ipfsHash: certificate.ipfsHash,
            certificateType: certificate.certificateType,
            recipientName: certificate.recipientName,
            issuerName: certificate.issuerName,
            issueDate: new Date(Number(certificate.issueDate) * 1000),
            isValid: certificate.isValid,
          }
        : null,
    };
  } catch (error) {
    console.error("Error verifying certificate:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify a certificate by token ID
 */
export async function verifyCertificateById(tokenId) {
  try {
    const contract = getContractRead();
    const [exists, isValid, certificate] = await contract.verifyCertificateById(
      tokenId
    );

    return {
      success: true,
      exists,
      isValid,
      certificate: exists
        ? {
            tokenId: certificate.tokenId.toString(),
            recipient: certificate.recipient,
            issuer: certificate.issuer,
            ipfsHash: certificate.ipfsHash,
            certificateType: certificate.certificateType,
            recipientName: certificate.recipientName,
            issuerName: certificate.issuerName,
            issueDate: new Date(Number(certificate.issueDate) * 1000),
            isValid: certificate.isValid,
          }
        : null,
    };
  } catch (error) {
    console.error("Error verifying certificate:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get all certificates for a user
 */
export async function getUserCertificates(userAddress) {
  try {
    const contract = getContractRead();
    const certificates = await contract.getUserCertificates(userAddress);

    return {
      success: true,
      certificates: certificates.map((cert) => ({
        tokenId: cert.tokenId.toString(),
        recipient: cert.recipient,
        issuer: cert.issuer,
        ipfsHash: cert.ipfsHash,
        certificateType: cert.certificateType,
        recipientName: cert.recipientName,
        issuerName: cert.issuerName,
        issueDate: new Date(Number(cert.issueDate) * 1000),
        isValid: cert.isValid,
      })),
    };
  } catch (error) {
    console.error("Error getting user certificates:", error);
    return {
      success: false,
      error: error.message,
      certificates: [],
    };
  }
}

/**
 * Revoke a certificate
 */
export async function revokeCertificate(tokenId) {
  try {
    const contract = await getContractWrite();

    let tx;
    try {
      tx = await contract.revokeCertificate(tokenId);
      console.log("Revocation transaction submitted:", tx.hash);
    } catch (txError) {
      console.error("Error during transaction submission:", txError);

      if (isUserRejectionError(txError)) {
        return {
          success: false,
          error: "Transaction was rejected by user.",
          userRejected: true,
        };
      }

      throw txError;
    }

    let receipt;
    try {
      receipt = await tx.wait();
      console.log("Revocation confirmed:", receipt);
    } catch (waitError) {
      console.error("Error during transaction waiting:", waitError);

      if (isUserRejectionError(waitError)) {
        return {
          success: false,
          error: "Transaction was rejected by user.",
          userRejected: true,
        };
      }

      throw waitError;
    }

    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("Error revoking certificate:", error);

    // Check for user rejection first
    if (isUserRejectionError(error)) {
      return {
        success: false,
        error: "Transaction was rejected by user.",
        userRejected: true,
      };
    }

    // Provide more user-friendly error messages for other errors
    let userFriendlyMessage = error.message;

    if (error.message.includes("insufficient funds")) {
      userFriendlyMessage =
        "Insufficient ETH for gas fees. Please add more ETH to your wallet.";
    } else if (error.code === "CALL_EXCEPTION") {
      userFriendlyMessage =
        "Smart contract call failed. This could be due to insufficient permissions or the certificate may already be revoked.";
    }

    return {
      success: false,
      error: userFriendlyMessage,
    };
  }
}

/**
 * Get total number of certificates
 */
export async function getTotalCertificates() {
  try {
    const contract = getContractRead();
    const total = await contract.getTotalCertificates();
    return { success: true, total: Number(total) };
  } catch (error) {
    console.error("Error getting total certificates:", error);
    return { success: false, error: error.message, total: 0 };
  }
}

/**
 * Grant issuer role to an address (admin only)
 */
export async function grantIssuerRole(address) {
  try {
    // Validate address format
    if (!address || typeof address !== "string") {
      throw new Error("Invalid address: address must be a string");
    }

    if (!ethers.isAddress(address)) {
      throw new Error("Invalid address: not a valid Ethereum address format");
    }

    const contract = await getContractWrite();

    let tx;
    try {
      tx = await contract.grantIssuerRole(address);
      console.log("Grant issuer role transaction submitted:", tx.hash);
    } catch (txError) {
      console.error(
        "Error during grant issuer role transaction submission:",
        txError
      );

      if (isUserRejectionError(txError)) {
        return {
          success: false,
          error: "Transaction was rejected by user.",
          userRejected: true,
        };
      }

      throw txError;
    }

    let receipt;
    try {
      receipt = await tx.wait();
      console.log("Grant issuer role confirmed:", receipt);
    } catch (waitError) {
      console.error(
        "Error during grant issuer role transaction waiting:",
        waitError
      );

      if (isUserRejectionError(waitError)) {
        return {
          success: false,
          error: "Transaction was rejected by user.",
          userRejected: true,
        };
      }

      throw waitError;
    }

    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("Error granting issuer role:", error);

    // Check for user rejection first
    if (isUserRejectionError(error)) {
      return {
        success: false,
        error: "Transaction was rejected by user.",
        userRejected: true,
      };
    }

    // Provide more user-friendly error messages for other errors
    let userFriendlyMessage = error.message;

    if (error.message.includes("insufficient funds")) {
      userFriendlyMessage =
        "Insufficient ETH for gas fees. Please add more ETH to your wallet.";
    } else if (error.code === "CALL_EXCEPTION") {
      userFriendlyMessage =
        "Smart contract call failed. This could be due to insufficient permissions.";
    }

    return {
      success: false,
      error: userFriendlyMessage,
    };
  }
}

/**
 * Revoke issuer role from an address (admin only)
 */
export async function revokeIssuerRole(address) {
  try {
    // Validate address format
    if (!address || typeof address !== "string") {
      throw new Error("Invalid address: address must be a string");
    }

    if (!ethers.isAddress(address)) {
      throw new Error("Invalid address: not a valid Ethereum address format");
    }

    const contract = await getContractWrite();

    let tx;
    try {
      tx = await contract.revokeIssuerRole(address);
      console.log("Revoke issuer role transaction submitted:", tx.hash);
    } catch (txError) {
      console.error(
        "Error during revoke issuer role transaction submission:",
        txError
      );

      if (isUserRejectionError(txError)) {
        return {
          success: false,
          error: "Transaction was rejected by user.",
          userRejected: true,
        };
      }

      throw txError;
    }

    let receipt;
    try {
      receipt = await tx.wait();
      console.log("Revoke issuer role confirmed:", receipt);
    } catch (waitError) {
      console.error(
        "Error during revoke issuer role transaction waiting:",
        waitError
      );

      if (isUserRejectionError(waitError)) {
        return {
          success: false,
          error: "Transaction was rejected by user.",
          userRejected: true,
        };
      }

      throw waitError;
    }

    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("Error revoking issuer role:", error);

    // Check for user rejection first
    if (isUserRejectionError(error)) {
      return {
        success: false,
        error: "Transaction was rejected by user.",
        userRejected: true,
      };
    }

    // Provide more user-friendly error messages for other errors
    let userFriendlyMessage = error.message;

    if (error.message.includes("insufficient funds")) {
      userFriendlyMessage =
        "Insufficient ETH for gas fees. Please add more ETH to your wallet.";
    } else if (error.code === "CALL_EXCEPTION") {
      userFriendlyMessage =
        "Smart contract call failed. This could be due to insufficient permissions.";
    }

    return {
      success: false,
      error: userFriendlyMessage,
    };
  }
}

/**
 * Get users with their blockchain roles
 */
export async function getUsersWithBlockchainRoles() {
  try {
    // This will need to be implemented differently since we can't easily enumerate all addresses
    // For now, return empty array and let the component handle known addresses
    return {
      success: true,
      users: [],
    };
  } catch (error) {
    console.error("Error getting users with blockchain roles:", error);
    return {
      success: false,
      error: error.message,
      users: [],
    };
  }
}

/**
 * Listen for certificate events
 */
export function listenForCertificateEvents(callback) {
  try {
    const contract = getContractRead();

    contract.on(
      "CertificateIssued",
      (tokenId, recipient, issuer, ipfsHash, certificateType, event) => {
        callback({
          type: "CertificateIssued",
          tokenId: tokenId.toString(),
          recipient,
          issuer,
          ipfsHash,
          certificateType,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
        });
      }
    );

    contract.on("CertificateRevoked", (tokenId, revoker, event) => {
      callback({
        type: "CertificateRevoked",
        tokenId: tokenId.toString(),
        revoker,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
      });
    });

    return () => {
      contract.removeAllListeners();
    };
  } catch (error) {
    console.error("Error setting up event listeners:", error);
    return null;
  }
}

/**
 * Connect to MetaMask and switch to the correct network if needed
 */
export async function connectWallet() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found. Please install MetaMask.");
  }

  try {
    // Request account access
    await window.ethereum.request({ method: "eth_requestAccounts" });

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    // Check if we're on the correct network
    if (Number(network.chainId) !== Number(CONTRACT_CONFIG.chainId)) {
      // Try to switch to the correct network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [
          { chainId: `0x${Number(CONTRACT_CONFIG.chainId).toString(16)}` },
        ],
      });
    }

    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // Check user roles
    const rolesResult = await checkUserRoles(address);

    return {
      success: true,
      address,
      chainId: network.chainId,
      contractAddress: CONTRACT_CONFIG.address,
      isIssuer: rolesResult.isIssuer || false,
      isAdmin: rolesResult.isAdmin || false,
    };
  } catch (error) {
    console.error("Error connecting wallet:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * @returns {Promise<object>} Object with user roles (isAdmin, isIssuer)
 */
export const checkUserRoles = async (address) => {
  try {
    // Validate address format to prevent ENS resolution attempts
    if (!address || typeof address !== "string") {
      throw new Error("Invalid address: address must be a string");
    }

    // Check if it's a valid Ethereum address format
    if (!ethers.isAddress(address)) {
      throw new Error("Invalid address: not a valid Ethereum address format");
    }

    const contract = getContractRead();
    const isAdmin = await contract.isAdmin(address);
    const isIssuer = await contract.isIssuer(address);
    return { success: true, isAdmin, isIssuer };
  } catch (error) {
    console.error("Error checking roles:", error);
    return {
      success: false,
      error: error.message,
      isAdmin: false,
      isIssuer: false,
    };
  }
};

/**
 * Unpause the contract (admin only)
 */
export async function unpauseContract() {
  try {
    const contract = await getContractWrite();

    // Check if user is admin
    const signerAddress = await contract.runner.getAddress();
    const isAdmin = await contract.isAdmin(signerAddress);

    if (!isAdmin) {
      throw new Error("Only admins can unpause the contract");
    }

    let tx;
    try {
      tx = await contract.unpause();
    } catch (txError) {
      console.error("Error during unpause transaction submission:", txError);

      if (isUserRejectionError(txError)) {
        return {
          success: false,
          error: "Transaction was rejected by user.",
          userRejected: true,
        };
      }

      throw txError;
    }

    let receipt;
    try {
      receipt = await tx.wait();
    } catch (waitError) {
      console.error("Error during unpause transaction waiting:", waitError);

      if (isUserRejectionError(waitError)) {
        return {
          success: false,
          error: "Transaction was rejected by user.",
          userRejected: true,
        };
      }

      throw waitError;
    }

    return {
      success: true,
      transactionHash: receipt.transactionHash,
    };
  } catch (error) {
    console.error("Error unpausing contract:", error);

    // Check for user rejection first
    if (isUserRejectionError(error)) {
      return {
        success: false,
        error: "Transaction was rejected by user.",
        userRejected: true,
      };
    }

    // Provide more user-friendly error messages for other errors
    let userFriendlyMessage = error.message;

    if (error.message.includes("insufficient funds")) {
      userFriendlyMessage =
        "Insufficient ETH for gas fees. Please add more ETH to your wallet.";
    } else if (error.code === "CALL_EXCEPTION") {
      userFriendlyMessage =
        "Smart contract call failed. This could be due to insufficient permissions or the contract may already be unpaused.";
    }

    return {
      success: false,
      error: userFriendlyMessage,
    };
  }
}

/**
 * Pause the contract (admin only)
 */
export async function pauseContract() {
  try {
    const contract = await getContractWrite();

    // Check if user is admin
    const signerAddress = await contract.runner.getAddress();
    const isAdmin = await contract.isAdmin(signerAddress);

    if (!isAdmin) {
      throw new Error("Only admins can pause the contract");
    }

    let tx;
    try {
      tx = await contract.pause();
    } catch (txError) {
      console.error("Error during pause transaction submission:", txError);

      if (isUserRejectionError(txError)) {
        return {
          success: false,
          error: "Transaction was rejected by user.",
          userRejected: true,
        };
      }

      throw txError;
    }

    let receipt;
    try {
      receipt = await tx.wait();
    } catch (waitError) {
      console.error("Error during pause transaction waiting:", waitError);

      if (isUserRejectionError(waitError)) {
        return {
          success: false,
          error: "Transaction was rejected by user.",
          userRejected: true,
        };
      }

      throw waitError;
    }

    return {
      success: true,
      transactionHash: receipt.transactionHash,
    };
  } catch (error) {
    console.error("Error pausing contract:", error);

    // Check for user rejection first
    if (isUserRejectionError(error)) {
      return {
        success: false,
        error: "Transaction was rejected by user.",
        userRejected: true,
      };
    }

    // Provide more user-friendly error messages for other errors
    let userFriendlyMessage = error.message;

    if (error.message.includes("insufficient funds")) {
      userFriendlyMessage =
        "Insufficient ETH for gas fees. Please add more ETH to your wallet.";
    } else if (error.code === "CALL_EXCEPTION") {
      userFriendlyMessage =
        "Smart contract call failed. This could be due to insufficient permissions or the contract may already be paused.";
    }

    return {
      success: false,
      error: userFriendlyMessage,
    };
  }
}

/**
 * Check if contract is paused
 */
export async function getContractStatus() {
  try {
    const contract = await getContractRead();
    const isPaused = await contract.paused();
    const totalCertificates = await contract.getTotalCertificates();

    return {
      success: true,
      isPaused,
      totalCertificates: Number(totalCertificates),
    };
  } catch (error) {
    console.error("Error getting contract status:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export { CONTRACT_CONFIG, CERTIFICATE_NFT_ABI };
