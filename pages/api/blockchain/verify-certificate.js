import {
  verifyCertificateByHash,
  verifyCertificateById,
} from "../../../utils/contract";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { ipfsHash, tokenId } = req.query;

    // Must provide either ipfsHash or tokenId
    if (!ipfsHash && !tokenId) {
      return res.status(400).json({
        error: "Must provide either ipfsHash or tokenId parameter",
      });
    }

    let result;

    if (ipfsHash) {
      // Verify by IPFS hash
      result = await verifyCertificateByHash(ipfsHash);
    } else {
      // Verify by token ID
      const tokenIdNum = parseInt(tokenId);
      if (isNaN(tokenIdNum) || tokenIdNum <= 0) {
        return res.status(400).json({
          error: "Invalid tokenId format",
        });
      }
      result = await verifyCertificateById(tokenIdNum);
    }

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
