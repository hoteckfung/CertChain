import mysql from "../../../../utils/mysql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { hash } = req.query;

    if (!hash) {
      return res.status(400).json({ error: "IPFS hash is required" });
    }

    // Search for certificate by IPFS hash across all certificates
    const { data, error } = await mysql.query(
      "SELECT * FROM certificates WHERE ipfs_hash = ? LIMIT 1",
      [hash]
    );

    if (error) {
      console.error("Error searching for certificate:", error);
      return res.status(500).json({
        error: "Failed to search for certificate",
        details: error.message,
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Certificate not found",
      });
    }

    const cert = data[0];

    // Transform database format to frontend format
    const transformedCertificate = {
      id: cert.id.toString(),
      title: cert.title,
      issuer: cert.issuer_wallet,
      type: cert.description || "Certificate",
      status: cert.status,
      issueDate: cert.issue_date
        ? new Date(cert.issue_date).toLocaleDateString()
        : null,
      hash: cert.ipfs_hash,
      description: cert.description,
      tokenId: cert.token_id,
      transactionHash: cert.transaction_hash,
      blockNumber: cert.block_number,
      holderWallet: cert.holder_wallet,
      issuerWallet: cert.issuer_wallet,
    };

    res.status(200).json({
      success: true,
      certificate: transformedCertificate,
    });
  } catch (error) {
    console.error("Error in certificate verification API:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
