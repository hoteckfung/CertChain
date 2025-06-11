import mysql from "../../../../utils/mysql";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/i.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address format" });
    }

    // Get certificates for the specific holder
    const { data: certificates, error } = await mysql.getCertificatesByHolder(
      walletAddress
    );

    if (error) {
      console.error("Error fetching certificates for holder:", error);
      return res.status(500).json({
        error: "Failed to fetch certificates",
        details: error.message,
      });
    }

    // Transform database format to frontend format
    const transformedCertificates = certificates.map((cert) => ({
      id: cert.id.toString(),
      title: cert.title,
      issuer: cert.issuer_wallet, // Could be enhanced to show issuer name
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
    }));

    res.status(200).json({
      success: true,
      certificates: transformedCertificates,
      count: transformedCertificates.length,
    });
  } catch (error) {
    console.error("Error in holder certificates API:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
