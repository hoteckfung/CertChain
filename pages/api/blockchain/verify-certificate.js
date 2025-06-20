import { verifyCertificateByHash } from "../../../utils/contract";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { ipfsHash } = req.query;

    // Must provide ipfsHash
    if (!ipfsHash) {
      return res.status(400).json({
        error: "Must provide ipfsHash parameter",
      });
    }

    // Verify by IPFS hash
    const result = await verifyCertificateByHash(ipfsHash);

    if (!result.success) {
      return res.status(500).json({
        error: "Failed to verify certificate",
        details: result.error,
      });
    }

    if (!result.exists) {
      return res.status(404).json({
        success: true,
        exists: false,
        message: "Certificate not found on blockchain",
      });
    }

    res.status(200).json({
      success: true,
      exists: result.exists,
      isValid: result.isValid,
      certificate: result.certificate,
      message: result.isValid
        ? "Certificate is valid"
        : "Certificate has been revoked",
    });
  } catch (error) {
    console.error("Error verifying certificate:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
