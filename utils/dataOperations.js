// Utility functions for data operations (mock implementation)

/**
 * Get certificates for a specific holder by wallet address
 * @param {string} walletAddress - The wallet address of the holder
 * @returns {Promise<Array>} Array of certificate objects for the specific holder
 */
export async function getHolderCertificates(walletAddress) {
  if (!walletAddress) {
    throw new Error("Wallet address is required to fetch certificates");
  }

  try {
    // Fetch certificates from the database via API
    const response = await fetch(`/api/certificates/holder/${walletAddress}`);

    if (!response.ok) {
      if (response.status === 404) {
        // No certificates found for this holder
        return [];
      }
      throw new Error(`Failed to fetch certificates: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch certificates");
    }

    return data.certificates || [];
  } catch (error) {
    console.error("Error fetching holder certificates:", error);

    // Return empty array instead of mock data to prevent showing other users' certificates
    return [];
  }
}

/**
 * Get certificates for verification (public access)
 * @param {string} hash - IPFS hash of the certificate to verify
 * @returns {Promise<Object|null>} Certificate object or null if not found
 */
export async function getVerifierCertificate(hash) {
  if (!hash) {
    throw new Error("IPFS hash is required for verification");
  }

  try {
    // For verification, we can search all certificates by hash via API
    const response = await fetch(`/api/certificates/verify/${hash}`);

    if (!response.ok) {
      if (response.status === 404) {
        // Certificate not found
        return null;
      }
      throw new Error(`Failed to verify certificate: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to verify certificate");
    }

    return data.certificate || null;
  } catch (error) {
    console.error("Error verifying certificate:", error);
    return null;
  }
}

/**
 * Get certificates issued by a specific issuer by wallet address
 * @param {string} walletAddress - The wallet address of the issuer
 * @returns {Promise<Array>} Array of certificate objects issued by the specific issuer
 */
export async function getIssuerCertificates(walletAddress) {
  if (!walletAddress) {
    throw new Error("Wallet address is required to fetch certificates");
  }

  try {
    // Fetch certificates from the database via API
    const response = await fetch(`/api/certificates/issuer/${walletAddress}`);

    if (!response.ok) {
      if (response.status === 404) {
        // No certificates found for this issuer
        return [];
      }
      throw new Error(`Failed to fetch certificates: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch certificates");
    }

    return data.certificates || [];
  } catch (error) {
    console.error("Error fetching issuer certificates:", error);

    // Return empty array instead of mock data to prevent showing other issuers' certificates
    return [];
  }
}

export default {
  getHolderCertificates,
  getVerifierCertificate,
  getIssuerCertificates,
};
