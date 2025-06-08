// Real IPFS utility functions for CertChain connecting to local IPFS Desktop

// IPFS Desktop default endpoints
const IPFS_API_URL = "http://localhost:5001";
const IPFS_GATEWAY_URL = "http://localhost:8080";

/**
 * Upload a file to local IPFS node
 * @param {File} file - The file to upload
 * @param {string} name - Name for the file
 * @returns {Promise<{hash: string, timestamp: string, name: string, size: number}>}
 */
export async function uploadToPinata(file, name) {
  try {
    console.log("Uploading to local IPFS node:", name);

    // Create FormData for the file
    const formData = new FormData();
    formData.append("file", file, name);

    // Upload to IPFS via HTTP API
    const response = await fetch(`${IPFS_API_URL}/api/v0/add?pin=true`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `IPFS upload failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.text();
    const ipfsResponse = JSON.parse(result);

    console.log("IPFS upload successful:", ipfsResponse);

    return {
      hash: ipfsResponse.Hash,
      timestamp: new Date().toISOString(),
      name: name,
      size: file.size,
      ipfsData: true,
    };
  } catch (error) {
    console.error("Error uploading to IPFS:", error);

    // If IPFS is not available, show helpful error
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("Network")
    ) {
      throw new Error(
        "Could not connect to IPFS Desktop. Please ensure IPFS Desktop is running and CORS is enabled."
      );
    }

    throw error;
  }
}

/**
 * Get the URL for an IPFS hash
 * @param {string} hash - The IPFS hash
 * @param {boolean} useGateway - Whether to use local gateway (default: true)
 * @returns {string} - The IPFS URL
 */
export function getIPFSUrl(hash, useGateway = true) {
  if (!hash) return "";

  // Use local IPFS gateway
  if (useGateway) {
    return `${IPFS_GATEWAY_URL}/ipfs/${hash}`;
  }

  // ipfs:// protocol (requires IPFS companion or similar)
  return `ipfs://${hash}`;
}

/**
 * Test IPFS connection
 * @returns {Promise<{connected: boolean, peerID?: string, error?: string}>}
 */
export async function testAuthentication() {
  try {
    console.log("Testing IPFS connection...");

    const response = await fetch(`${IPFS_API_URL}/api/v0/id`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`IPFS connection failed: ${response.status}`);
    }

    const result = await response.text();
    const ipfsInfo = JSON.parse(result);

    console.log("IPFS connection successful:", ipfsInfo);

    return {
      connected: true,
      peerID: ipfsInfo.ID,
      agentVersion: ipfsInfo.AgentVersion,
    };
  } catch (error) {
    console.error("IPFS connection test failed:", error);
    return {
      connected: false,
      error: error.message,
    };
  }
}

/**
 * Check if a string is a valid IPFS hash
 * @param {string} hash - The hash to check
 * @returns {boolean} - Whether the hash is valid
 */
export function isValidIPFSHash(hash) {
  // IPFS hashes can start with "Qm" (v0) or "bafy" (v1)
  return (
    typeof hash === "string" &&
    ((hash.startsWith("Qm") && hash.length === 46) ||
      (hash.startsWith("bafy") && hash.length >= 56))
  );
}

/**
 * Get IPFS node information
 * @returns {Promise<Object>} - IPFS node info
 */
export async function getIPFSInfo() {
  try {
    const response = await fetch(`${IPFS_API_URL}/api/v0/id`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Failed to get IPFS info: ${response.status}`);
    }

    const result = await response.text();
    return JSON.parse(result);
  } catch (error) {
    console.error("Error getting IPFS info:", error);
    throw error;
  }
}

export default {
  uploadToPinata,
  getIPFSUrl,
  testAuthentication,
  isValidIPFSHash,
  getIPFSInfo,
};
