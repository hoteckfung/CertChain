// Utility functions for data operations (mock implementation)

/**
 * Get certificates for the current holder
 * @returns {Promise<Array>} Array of certificate objects
 */
export async function getHolderCertificates() {
  // In a real app, this would fetch from an API or blockchain
  const mockCertificates = [
    {
      id: "cert-001",
      title: "Advanced Blockchain Development",
      issuer: "Blockchain Academy",
      type: "Certificate of Completion",
      status: "Verified",
      issueDate: "2023-05-15",
      expiryDate: "2025-05-15",
      hash: "QmXS2LfM4sg39AbjxHKiWQB9PsZgUKaBmtEP764e7CDer5",
      description:
        "This certificate verifies completion of the Advanced Blockchain Development course.",
      metadata: {
        courseHours: "120 hours",
        grade: "A",
        instructor: "Dr. Satoshi Nakamoto",
      },
    },
    {
      id: "cert-002",
      title: "Smart Contract Security",
      issuer: "Web3 Security Institute",
      type: "Professional Certification",
      status: "Issued",
      issueDate: "2023-08-22",
      hash: "QmYA7p467t4BGgBL4NmyHtsXMoPrYH9b3kSG6dbgFYskJm",
      description:
        "Certification in identifying and mitigating security vulnerabilities in smart contracts.",
    },
    {
      id: "cert-003",
      title: "Decentralized Application Architecture",
      issuer: "DApp University",
      type: "Course Certificate",
      status: "Pending",
      issueDate: "2023-11-10",
      hash: "QmZZrTyPX2EZzCZrQAQoYyHEEz3Unsd8zcAHbKHCR4LMCJ",
      description:
        "This certificate is pending verification on the blockchain.",
    },
    {
      id: "cert-004",
      title: "Blockchain for Business",
      issuer: "Enterprise Blockchain Consortium",
      type: "Professional Certificate",
      status: "Verified",
      issueDate: "2023-03-05",
      expiryDate: "2026-03-05",
      hash: "QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB",
      description:
        "Professional certification for implementing blockchain solutions in enterprise environments.",
      metadata: {
        level: "Advanced",
        credentialID: "EBC-22-78945",
        skills: "Hyperledger, Enterprise Ethereum, Tokenization",
      },
    },
  ];

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  return mockCertificates;
}

/**
 * Get certificates for verification (public access)
 * @param {string} hash - IPFS hash of the certificate to verify
 * @returns {Promise<Object|null>} Certificate object or null if not found
 */
export async function getVerifierCertificate(hash) {
  // In a real app, this would query the blockchain or API
  const certificates = await getHolderCertificates();
  return certificates.find((cert) => cert.hash === hash) || null;
}

/**
 * Get certificates issued by the current issuer
 * @returns {Promise<Array>} Array of certificate objects
 */
export async function getIssuerCertificates() {
  // Similar to holder certificates but with different status options
  const holderCerts = await getHolderCertificates();

  // Modify the certificates to represent issuer's view
  return holderCerts.map((cert) => ({
    ...cert,
    recipient: "0xD8f24D419153E5D03d614c5155f900f4B5C8A65a",
    recipientName: "John Doe",
    status: cert.status === "Pending" ? "Draft" : cert.status,
  }));
}

export default {
  getHolderCertificates,
  getVerifierCertificate,
  getIssuerCertificates,
};
