import mysql from "../../../utils/mysql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      tokenId,
      ipfsHash,
      issuerWallet,
      holderWallet,
      title,
      description,
      transactionHash,
      blockNumber,
    } = req.body;

    // Validate required fields
    if (!tokenId || !ipfsHash || !issuerWallet || !holderWallet || !title) {
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "tokenId",
          "ipfsHash",
          "issuerWallet",
          "holderWallet",
          "title",
        ],
      });
    }

    // Validate Ethereum address formats
    if (
      !/^0x[a-fA-F0-9]{40}$/i.test(issuerWallet) ||
      !/^0x[a-fA-F0-9]{40}$/i.test(holderWallet)
    ) {
      return res.status(400).json({ error: "Invalid wallet address format" });
    }

    // Get or create users in database
    let issuerUser = null;
    let holderUser = null;

    // Get issuer user
    const { data: existingIssuer } = await mysql.getUserByWalletAddress(
      issuerWallet
    );
    if (existingIssuer) {
      issuerUser = existingIssuer;
    } else {
      const { data: newIssuer } = await mysql.createUser({
        wallet_address: issuerWallet.toLowerCase(),
        role: "issuer",
        permissions: JSON.stringify([
          "issue_certificates",
          "view_certificates",
        ]),
      });
      issuerUser = newIssuer;
    }

    // Get holder user
    const { data: existingHolder } = await mysql.getUserByWalletAddress(
      holderWallet
    );
    if (existingHolder) {
      holderUser = existingHolder;
    } else {
      const { data: newHolder } = await mysql.createUser({
        wallet_address: holderWallet.toLowerCase(),
        role: "holder",
        permissions: JSON.stringify(["view_certificates"]),
      });
      holderUser = newHolder;
    }

    // Check if certificate already exists
    const { data: existingCert } = await mysql.query(
      "SELECT id FROM certificates WHERE token_id = ? OR ipfs_hash = ?",
      [tokenId, ipfsHash]
    );

    if (existingCert && existingCert.length > 0) {
      return res.status(409).json({
        error: "Certificate already exists",
        certificateId: existingCert[0].id,
      });
    }

    // Create certificate in database
    const certificateData = {
      token_id: tokenId,
      ipfs_hash: ipfsHash,
      issuer_id: issuerUser.id,
      holder_id: holderUser.id,
      issuer_wallet: issuerWallet.toLowerCase(),
      holder_wallet: holderWallet.toLowerCase(),
      title: title,
      description: description || "Certificate issued on blockchain",
      transaction_hash: transactionHash,
      block_number: blockNumber,
    };

    const { data: createdCert, error } = await mysql.createCertificate(
      certificateData
    );

    if (error) {
      console.error("Error creating certificate:", error);
      return res.status(500).json({
        error: "Failed to create certificate",
        details: error.message,
      });
    }

    // Log activity
    await mysql.logActivity({
      user_id: issuerUser.id,
      action: "certificate_issued",
      entity_type: "certificate",
      entity_id: tokenId,
      details: `Certificate "${title}" issued to ${holderWallet}`,
      wallet_address: issuerWallet,
      target_wallet_address: holderWallet,
      token_id: tokenId,
      ipfs_hash: ipfsHash,
      transaction_hash: transactionHash,
      block_number: blockNumber,
      category: "certificate_management",
    });

    res.status(201).json({
      success: true,
      message: "Certificate created successfully",
      certificate: {
        id: createdCert?.insertId || "created",
        tokenId,
        ipfsHash,
        issuerWallet,
        holderWallet,
        title,
        description: certificateData.description,
      },
    });
  } catch (error) {
    console.error("Error in certificate creation API:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
