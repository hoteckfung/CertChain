// Simple mock IPFS utility functions for CertChain

// Mock data
const MOCK_IPFS_HASH = "QmXS2LfM4sg39AbjxHKiWQB9PsZgUKaBmtEP764e7CDer5";
const MOCK_HASHES = [
  "QmXS2LfM4sg39AbjxHKiWQB9PsZgUKaBmtEP764e7CDer5",
  "QmYA7p467t4BGgBL4NmyHtsXMoPrYH9b3kSG6dbgFYskJm",
  "QmZZrTyPX2EZzCZrQAQoYyHEEz3Unsd8zcAHbKHCR4LMCJ",
  "QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB",
];

/**
 * Mock upload function that simulates uploading a file to IPFS
 * @param {File} file - The file to upload
 * @param {string} name - Name for the file
 * @returns {Promise<{hash: string, timestamp: string, name: string, size: number, mockData: boolean}>}
 */
export async function uploadToPinata(file, name) {
  try {
    console.log("Mock IPFS upload for file:", name);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Generate a random hash from the mock hashes or use the default
    const hash =
      MOCK_HASHES[Math.floor(Math.random() * MOCK_HASHES.length)] ||
      MOCK_IPFS_HASH;

    return {
      hash,
      timestamp: new Date().toISOString(),
      name: name,
      size: file ? file.size : 1024,
      mockData: true,
    };
  } catch (error) {
    console.error("Error in mock IPFS upload:", error);
    throw error;
  }
}

/**
 * Get the URL for an IPFS hash (mock implementation)
 * @param {string} hash - The IPFS hash
 * @param {boolean} useGateway - Whether to use a public gateway (default: true)
 * @returns {string} - The IPFS URL
 */
export function getIPFSUrl(hash, useGateway = true) {
  if (!hash) return "";

  // Use a public gateway for better accessibility
  if (useGateway) {
    return `https://ipfs.io/ipfs/${hash}`;
  }

  // ipfs:// protocol (requires IPFS companion or similar)
  return `ipfs://${hash}`;
}

/**
 * Test authentication (always returns true since we're using mock data)
 * @returns {Promise<boolean>} - Always returns true
 */
export async function testAuthentication() {
  console.log("Mock IPFS authentication - always successful");

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return true;
}

/**
 * Check if a string is a valid IPFS hash
 * @param {string} hash - The hash to check
 * @returns {boolean} - Whether the hash is valid
 */
export function isValidIPFSHash(hash) {
  // Simple validation: IPFS hashes start with "Qm" and are 46 characters long
  return (
    typeof hash === "string" && hash.startsWith("Qm") && hash.length === 46
  );
}

export default {
  uploadToPinata,
  getIPFSUrl,
  testAuthentication,
  isValidIPFSHash,
};
