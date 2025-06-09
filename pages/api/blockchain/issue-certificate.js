import { issueCertificateOnChain } from "../../../utils/contract";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      recipientAddress,
      ipfsHash,
      certificateType,
      recipientName,
      issuerName,
    } = req.body;

    // Validate required fields
    if (
      !recipientAddress ||
      !ipfsHash ||
      !certificateType ||
      !recipientName ||
      !issuerName
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "recipientAddress",
          "ipfsHash",
          "certificateType",
          "recipientName",
          "issuerName",
        ],
      });
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      return res.status(400).json({
        error: "Invalid recipient address format",
      });
    }

    // Issue certificate on blockchain
    const result = await issueCertificateOnChain({
      recipientAddress,
      ipfsHash,
      certificateType,
      recipientName,
      issuerName,
    });

    if (!result.success) {
      return res.status(500).json({
        error: "Failed to issue certificate on blockchain",
        details: result.error,
      });
    }

    res.status(200).json({
      success: true,
      message: "Certificate issued successfully on blockchain",
      tokenId: result.tokenId,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      ipfsHash,
      recipientAddress,
      certificateType,
    });
  } catch (error) {
    console.error("Error issuing certificate on blockchain:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
