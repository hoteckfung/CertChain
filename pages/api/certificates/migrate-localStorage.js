import mysql from "../../../utils/mysql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { certificates, issuerWallet } = req.body;

    if (!certificates || !Array.isArray(certificates)) {
      return res
        .status(400)
        .json({ error: "Valid certificates array is required" });
    }

    if (!issuerWallet || !/^0x[a-fA-F0-9]{40}$/i.test(issuerWallet)) {
      return res
        .status(400)
        .json({ error: "Valid issuer wallet address is required" });
    }

    const results = [];
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const cert of certificates) {
      try {
        // Check if certificate already exists in database
        const { data: existingCert } = await mysql.query(
          "SELECT id FROM certificates WHERE token_id = ? OR ipfs_hash = ?",
          [cert.tokenId, cert.hash]
        );

        if (existingCert && existingCert.length > 0) {
          results.push({
            certificate: cert.id,
            status: "skipped",
            reason: "already exists",
          });
          skipped++;
          continue;
        }

        // Get or create users
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
        const holderWallet = cert.holder || cert.holderWallet;
        if (!holderWallet) {
          results.push({
            certificate: cert.id,
            status: "error",
            reason: "missing holder wallet",
          });
          errors++;
          continue;
        }

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

        // Create certificate in database
        const certificateData = {
          token_id: cert.tokenId,
          ipfs_hash: cert.hash,
          issuer_id: issuerUser.id,
          holder_id: holderUser.id,
          issuer_wallet: issuerWallet.toLowerCase(),
          holder_wallet: holderWallet.toLowerCase(),
          title: cert.title || cert.name || "Migrated Certificate",
          description:
            cert.details ||
            cert.description ||
            "Certificate migrated from localStorage",
          transaction_hash: cert.transactionHash,
          block_number: cert.blockNumber,
        };

        const { error } = await mysql.createCertificate(certificateData);

        if (error) {
          results.push({
            certificate: cert.id,
            status: "error",
            reason: error.message,
          });
          errors++;
        } else {
          results.push({
            certificate: cert.id,
            status: "migrated",
          });
          migrated++;

          // Log activity
          await mysql.logActivity({
            user_id: issuerUser.id,
            action: "certificate_migrated",
            entity_type: "certificate",
            entity_id: cert.tokenId,
            details: `Certificate "${
              cert.title || cert.name
            }" migrated from localStorage`,
            wallet_address: issuerWallet,
            target_wallet_address: holderWallet,
            token_id: cert.tokenId,
            ipfs_hash: cert.hash,
            category: "certificate_management",
          });
        }
      } catch (certError) {
        console.error("Error migrating individual certificate:", certError);
        results.push({
          certificate: cert.id,
          status: "error",
          reason: certError.message,
        });
        errors++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Migration completed. ${migrated} migrated, ${skipped} skipped, ${errors} errors`,
      summary: {
        total: certificates.length,
        migrated,
        skipped,
        errors,
      },
      results,
    });
  } catch (error) {
    console.error("Error in certificate migration API:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
