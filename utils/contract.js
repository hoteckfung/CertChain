import { ethers } from "ethers";

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
};

/**
 * Get contract instance for read operations
 */
export function getContractRead() {
  const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.rpcUrl);
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
    const contract = await getContractWrite();

    const tx = await contract.issueCertificate(
      recipientAddress,
      ipfsHash,
      certificateType,
      recipientName,
      issuerName
    );

    console.log("Transaction submitted:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);

    // Extract token ID from the transaction receipt
    const tokenId = receipt.logs[0]?.topics[1]
      ? parseInt(receipt.logs[0].topics[1], 16)
      : null;

    return {
      success: true,
      tokenId,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("Error issuing certificate:", error);
    return {
      success: false,
      error: error.message,
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
    const tx = await contract.revokeCertificate(tokenId);

    console.log("Revocation transaction submitted:", tx.hash);
    const receipt = await tx.wait();
    console.log("Revocation confirmed:", receipt);

    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("Error revoking certificate:", error);
    return {
      success: false,
      error: error.message,
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
    const tx = await contract.grantIssuerRole(address);

    console.log("Grant issuer role transaction submitted:", tx.hash);
    const receipt = await tx.wait();
    console.log("Grant issuer role confirmed:", receipt);

    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("Error granting issuer role:", error);
    return {
      success: false,
      error: error.message,
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
    const tx = await contract.revokeIssuerRole(address);

    console.log("Revoke issuer role transaction submitted:", tx.hash);
    const receipt = await tx.wait();
    console.log("Revoke issuer role confirmed:", receipt);

    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("Error revoking issuer role:", error);
    return {
      success: false,
      error: error.message,
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

    return {
      success: true,
      address,
      chainId: network.chainId,
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

export { CONTRACT_CONFIG, CERTIFICATE_NFT_ABI };
