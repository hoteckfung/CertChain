const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateNFT", function () {
  let CertificateNFT;
  let certificateNFT;
  let owner;
  let issuer;
  let recipient;
  let verifier;
  let unauthorized;
  let addrs;

  // Test data
  const testCertificate = {
    ipfsHash: "QmTestHash123456789",
    certificateType: "Completion Certificate",
    recipientName: "John Doe",
    issuerName: "Tech University",
  };

  beforeEach(async function () {
    // Get signers
    [owner, issuer, recipient, verifier, unauthorized, ...addrs] =
      await ethers.getSigners();

    // Deploy contract
    CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    certificateNFT = await CertificateNFT.deploy();
    await certificateNFT.waitForDeployment();

    // Set up roles
    await certificateNFT.grantIssuerRole(issuer.address);
    await certificateNFT.grantVerifierRole(verifier.address);
  });

  describe("Deployment", function () {
    it("Should deploy with correct name and symbol", async function () {
      expect(await certificateNFT.name()).to.equal("CertChain Certificate");
      expect(await certificateNFT.symbol()).to.equal("CERT");
    });

    it("Should grant all roles to deployer", async function () {
      expect(await certificateNFT.isAdmin(owner.address)).to.be.true;
      expect(await certificateNFT.isIssuer(owner.address)).to.be.true;
      expect(await certificateNFT.isVerifier(owner.address)).to.be.true;
    });

    it("Should start with zero certificates", async function () {
      expect(await certificateNFT.getTotalCertificates()).to.equal(0);
    });
  });

  describe("Role Management", function () {
    it("Should allow admin to grant issuer role", async function () {
      await certificateNFT.grantIssuerRole(recipient.address);
      expect(await certificateNFT.isIssuer(recipient.address)).to.be.true;
    });

    it("Should allow admin to revoke issuer role", async function () {
      await certificateNFT.grantIssuerRole(recipient.address);
      await certificateNFT.revokeIssuerRole(recipient.address);
      expect(await certificateNFT.isIssuer(recipient.address)).to.be.false;
    });

    it("Should allow admin to grant verifier role", async function () {
      await certificateNFT.grantVerifierRole(recipient.address);
      expect(await certificateNFT.isVerifier(recipient.address)).to.be.true;
    });

    it("Should allow admin to revoke verifier role", async function () {
      await certificateNFT.grantVerifierRole(recipient.address);
      await certificateNFT.revokeVerifierRole(recipient.address);
      expect(await certificateNFT.isVerifier(recipient.address)).to.be.false;
    });

    it("Should not allow non-admin to grant roles", async function () {
      await expect(
        certificateNFT.connect(unauthorized).grantIssuerRole(recipient.address)
      ).to.be.reverted;
    });

    it("Should not allow non-admin to revoke roles", async function () {
      await expect(
        certificateNFT.connect(unauthorized).revokeIssuerRole(issuer.address)
      ).to.be.reverted;
    });
  });

  describe("Certificate Issuance", function () {
    it("Should allow issuer to issue a certificate", async function () {
      const tx = await certificateNFT
        .connect(issuer)
        .issueCertificate(
          recipient.address,
          testCertificate.ipfsHash,
          testCertificate.certificateType,
          testCertificate.recipientName,
          testCertificate.issuerName
        );

      await expect(tx)
        .to.emit(certificateNFT, "CertificateIssued")
        .withArgs(
          1,
          recipient.address,
          issuer.address,
          testCertificate.ipfsHash,
          testCertificate.certificateType
        );

      // Verify certificate was minted to recipient
      expect(await certificateNFT.ownerOf(1)).to.equal(recipient.address);
      expect(await certificateNFT.balanceOf(recipient.address)).to.equal(1);
    });

    it("Should store certificate data correctly", async function () {
      await certificateNFT
        .connect(issuer)
        .issueCertificate(
          recipient.address,
          testCertificate.ipfsHash,
          testCertificate.certificateType,
          testCertificate.recipientName,
          testCertificate.issuerName
        );

      const certificate = await certificateNFT.certificates(1);
      expect(certificate.tokenId).to.equal(1);
      expect(certificate.recipient).to.equal(recipient.address);
      expect(certificate.issuer).to.equal(issuer.address);
      expect(certificate.ipfsHash).to.equal(testCertificate.ipfsHash);
      expect(certificate.certificateType).to.equal(
        testCertificate.certificateType
      );
      expect(certificate.recipientName).to.equal(testCertificate.recipientName);
      expect(certificate.issuerName).to.equal(testCertificate.issuerName);
      expect(certificate.isValid).to.be.true;
    });

    it("Should set correct token URI", async function () {
      await certificateNFT
        .connect(issuer)
        .issueCertificate(
          recipient.address,
          testCertificate.ipfsHash,
          testCertificate.certificateType,
          testCertificate.recipientName,
          testCertificate.issuerName
        );

      const tokenURI = await certificateNFT.tokenURI(1);
      expect(tokenURI).to.equal(`ipfs://${testCertificate.ipfsHash}`);
    });

    it("Should increment token counter", async function () {
      await certificateNFT
        .connect(issuer)
        .issueCertificate(
          recipient.address,
          testCertificate.ipfsHash,
          testCertificate.certificateType,
          testCertificate.recipientName,
          testCertificate.issuerName
        );

      expect(await certificateNFT.getTotalCertificates()).to.equal(1);

      await certificateNFT
        .connect(issuer)
        .issueCertificate(
          recipient.address,
          "QmDifferentHash",
          testCertificate.certificateType,
          testCertificate.recipientName,
          testCertificate.issuerName
        );

      expect(await certificateNFT.getTotalCertificates()).to.equal(2);
    });

    it("Should not allow non-issuer to issue certificate", async function () {
      await expect(
        certificateNFT
          .connect(unauthorized)
          .issueCertificate(
            recipient.address,
            testCertificate.ipfsHash,
            testCertificate.certificateType,
            testCertificate.recipientName,
            testCertificate.issuerName
          )
      ).to.be.reverted;
    });

    it("Should not allow issuing to zero address", async function () {
      await expect(
        certificateNFT
          .connect(issuer)
          .issueCertificate(
            ethers.ZeroAddress,
            testCertificate.ipfsHash,
            testCertificate.certificateType,
            testCertificate.recipientName,
            testCertificate.issuerName
          )
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should not allow empty IPFS hash", async function () {
      await expect(
        certificateNFT
          .connect(issuer)
          .issueCertificate(
            recipient.address,
            "",
            testCertificate.certificateType,
            testCertificate.recipientName,
            testCertificate.issuerName
          )
      ).to.be.revertedWith("IPFS hash cannot be empty");
    });

    it("Should not allow duplicate IPFS hash", async function () {
      await certificateNFT
        .connect(issuer)
        .issueCertificate(
          recipient.address,
          testCertificate.ipfsHash,
          testCertificate.certificateType,
          testCertificate.recipientName,
          testCertificate.issuerName
        );

      await expect(
        certificateNFT
          .connect(issuer)
          .issueCertificate(
            recipient.address,
            testCertificate.ipfsHash,
            testCertificate.certificateType,
            testCertificate.recipientName,
            testCertificate.issuerName
          )
      ).to.be.revertedWith("Certificate with this IPFS hash already exists");
    });
  });

  describe("Certificate Verification", function () {
    beforeEach(async function () {
      await certificateNFT
        .connect(issuer)
        .issueCertificate(
          recipient.address,
          testCertificate.ipfsHash,
          testCertificate.certificateType,
          testCertificate.recipientName,
          testCertificate.issuerName
        );
    });

    it("Should verify certificate by IPFS hash", async function () {
      const [exists, isValid, certificate] =
        await certificateNFT.verifyCertificate(testCertificate.ipfsHash);

      expect(exists).to.be.true;
      expect(isValid).to.be.true;
      expect(certificate.tokenId).to.equal(1);
      expect(certificate.recipient).to.equal(recipient.address);
      expect(certificate.issuer).to.equal(issuer.address);
    });

    it("Should verify certificate by token ID", async function () {
      const [exists, isValid, certificate] =
        await certificateNFT.verifyCertificateById(1);

      expect(exists).to.be.true;
      expect(isValid).to.be.true;
      expect(certificate.tokenId).to.equal(1);
      expect(certificate.recipient).to.equal(recipient.address);
    });

    it("Should return false for non-existent IPFS hash", async function () {
      const [exists, isValid, certificate] =
        await certificateNFT.verifyCertificate("QmNonExistent");

      expect(exists).to.be.false;
      expect(isValid).to.be.false;
      expect(certificate.tokenId).to.equal(0);
    });

    it("Should return false for non-existent token ID", async function () {
      const [exists, isValid, certificate] =
        await certificateNFT.verifyCertificateById(999);

      expect(exists).to.be.false;
      expect(isValid).to.be.false;
      expect(certificate.tokenId).to.equal(0);
    });
  });

  describe("User Certificates", function () {
    beforeEach(async function () {
      // Issue multiple certificates to the same recipient
      await certificateNFT
        .connect(issuer)
        .issueCertificate(
          recipient.address,
          "QmHash1",
          "Certificate 1",
          testCertificate.recipientName,
          testCertificate.issuerName
        );

      await certificateNFT
        .connect(issuer)
        .issueCertificate(
          recipient.address,
          "QmHash2",
          "Certificate 2",
          testCertificate.recipientName,
          testCertificate.issuerName
        );
    });

    it("Should return all certificates for a user", async function () {
      const certificates = await certificateNFT.getUserCertificates(
        recipient.address
      );

      expect(certificates.length).to.equal(2);
      expect(certificates[0].ipfsHash).to.equal("QmHash1");
      expect(certificates[1].ipfsHash).to.equal("QmHash2");
    });

    it("Should return correct certificate count for user", async function () {
      const count = await certificateNFT.getUserCertificateCount(
        recipient.address
      );
      expect(count).to.equal(2);
    });

    it("Should return empty array for user with no certificates", async function () {
      const certificates = await certificateNFT.getUserCertificates(
        unauthorized.address
      );
      expect(certificates.length).to.equal(0);
    });
  });

  describe("Certificate Revocation", function () {
    beforeEach(async function () {
      await certificateNFT
        .connect(issuer)
        .issueCertificate(
          recipient.address,
          testCertificate.ipfsHash,
          testCertificate.certificateType,
          testCertificate.recipientName,
          testCertificate.issuerName
        );
    });

    it("Should allow issuer to revoke their own certificate", async function () {
      await expect(certificateNFT.connect(issuer).revokeCertificate(1))
        .to.emit(certificateNFT, "CertificateRevoked")
        .withArgs(1, issuer.address);

      const certificate = await certificateNFT.certificates(1);
      expect(certificate.isValid).to.be.false;
    });

    it("Should allow admin to revoke any certificate", async function () {
      await expect(certificateNFT.connect(owner).revokeCertificate(1))
        .to.emit(certificateNFT, "CertificateRevoked")
        .withArgs(1, owner.address);

      const certificate = await certificateNFT.certificates(1);
      expect(certificate.isValid).to.be.false;
    });

    it("Should not allow unauthorized user to revoke certificate", async function () {
      await expect(
        certificateNFT.connect(unauthorized).revokeCertificate(1)
      ).to.be.revertedWith(
        "Only admin or original issuer can revoke certificate"
      );
    });

    it("Should not allow revoking non-existent certificate", async function () {
      await expect(
        certificateNFT.connect(issuer).revokeCertificate(999)
      ).to.be.revertedWith("Certificate does not exist");
    });

    it("Should not allow revoking already revoked certificate", async function () {
      await certificateNFT.connect(issuer).revokeCertificate(1);

      await expect(
        certificateNFT.connect(issuer).revokeCertificate(1)
      ).to.be.revertedWith("Certificate is already revoked");
    });

    it("Should reflect revocation in verification", async function () {
      await certificateNFT.connect(issuer).revokeCertificate(1);

      const [exists, isValid, certificate] =
        await certificateNFT.verifyCertificate(testCertificate.ipfsHash);
      expect(exists).to.be.true;
      expect(isValid).to.be.false;
    });
  });

  describe("Pausable Functionality", function () {
    it("Should allow admin to pause contract", async function () {
      await certificateNFT.connect(owner).pause();
      expect(await certificateNFT.paused()).to.be.true;
    });

    it("Should allow admin to unpause contract", async function () {
      await certificateNFT.connect(owner).pause();
      await certificateNFT.connect(owner).unpause();
      expect(await certificateNFT.paused()).to.be.false;
    });

    it("Should not allow issuance when paused", async function () {
      await certificateNFT.connect(owner).pause();

      await expect(
        certificateNFT
          .connect(issuer)
          .issueCertificate(
            recipient.address,
            testCertificate.ipfsHash,
            testCertificate.certificateType,
            testCertificate.recipientName,
            testCertificate.issuerName
          )
      ).to.be.reverted;
    });

    it("Should not allow non-admin to pause", async function () {
      await expect(certificateNFT.connect(unauthorized).pause()).to.be.reverted;
    });
  });

  describe("ERC721 Compliance", function () {
    beforeEach(async function () {
      await certificateNFT
        .connect(issuer)
        .issueCertificate(
          recipient.address,
          testCertificate.ipfsHash,
          testCertificate.certificateType,
          testCertificate.recipientName,
          testCertificate.issuerName
        );
    });

    it("Should support ERC721 interface", async function () {
      expect(await certificateNFT.supportsInterface("0x80ac58cd")).to.be.true; // ERC721
    });

    it("Should support ERC721Metadata interface", async function () {
      expect(await certificateNFT.supportsInterface("0x5b5e139f")).to.be.true; // ERC721Metadata
    });

    it("Should support AccessControl interface", async function () {
      expect(await certificateNFT.supportsInterface("0x7965db0b")).to.be.true; // AccessControl
    });

    it("Should allow token transfer by owner", async function () {
      await certificateNFT
        .connect(recipient)
        .transferFrom(recipient.address, unauthorized.address, 1);
      expect(await certificateNFT.ownerOf(1)).to.equal(unauthorized.address);
    });

    it("Should not allow transfer when paused", async function () {
      await certificateNFT.connect(owner).pause();

      await expect(
        certificateNFT
          .connect(recipient)
          .transferFrom(recipient.address, unauthorized.address, 1)
      ).to.be.reverted;
    });
  });
});
