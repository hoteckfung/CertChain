// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CertificateNFT
 * @dev Smart contract for managing certificates as NFTs with role-based access control
 */
contract CertificateNFT is ERC721, ERC721URIStorage, AccessControl {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    // Token counter for unique certificate IDs
    uint256 private _tokenIdCounter;

    // Certificate structure
    struct Certificate {
        uint256 tokenId;
        address recipient;
        address issuer;
        string ipfsHash;
        string certificateType;
        string recipientName;
        string issuerName;
        uint256 issueDate;
        bool isValid;
    }

    // Mappings
    mapping(uint256 => Certificate) public certificates;
    mapping(string => uint256) public ipfsHashToTokenId;
    mapping(address => uint256[]) public userCertificates;
    mapping(address => uint256) public userCertificateCount;

    // Events
    event CertificateIssued(
        uint256 indexed tokenId,
        address indexed recipient,
        address indexed issuer,
        string ipfsHash,
        string certificateType
    );

    event CertificateRevoked(uint256 indexed tokenId, address indexed revoker);

    constructor() ERC721("CertChain Certificate", "CERT") {
        // The account that deploys the contract is the first administrator.
        // This admin can grant and revoke all other roles.
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Issue a new certificate as an NFT
     * @param recipient Address of the certificate recipient
     * @param ipfsHash IPFS hash of the certificate document
     * @param certificateType Type of certificate (e.g., "Completion", "Achievement")
     * @param recipientName Name of the certificate recipient
     * @param issuerName Name of the certificate issuer
     */
    function issueCertificate(
        address recipient,
        string memory ipfsHash,
        string memory certificateType,
        string memory recipientName,
        string memory issuerName
    ) public onlyRole(ISSUER_ROLE) returns (uint256) {
        require(recipient != address(0), "Invalid recipient address");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(
            ipfsHashToTokenId[ipfsHash] == 0,
            "Certificate with this IPFS hash already exists"
        );

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        // Mint the NFT to the recipient
        _safeMint(recipient, tokenId);

        // Set token URI to IPFS hash
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", ipfsHash)));

        // Store certificate data
        certificates[tokenId] = Certificate({
            tokenId: tokenId,
            recipient: recipient,
            issuer: msg.sender,
            ipfsHash: ipfsHash,
            certificateType: certificateType,
            recipientName: recipientName,
            issuerName: issuerName,
            issueDate: block.timestamp,
            isValid: true
        });

        // Update mappings
        ipfsHashToTokenId[ipfsHash] = tokenId;
        userCertificates[recipient].push(tokenId);
        userCertificateCount[recipient]++;

        emit CertificateIssued(
            tokenId,
            recipient,
            msg.sender,
            ipfsHash,
            certificateType
        );

        return tokenId;
    }

    /**
     * @dev Verify a certificate by IPFS hash
     * @param ipfsHash IPFS hash of the certificate to verify
     * @return exists Whether the certificate exists
     * @return isValid Whether the certificate is valid (not revoked)
     * @return certificate The certificate data
     */
    function verifyCertificate(
        string memory ipfsHash
    )
        public
        view
        returns (bool exists, bool isValid, Certificate memory certificate)
    {
        uint256 tokenId = ipfsHashToTokenId[ipfsHash];

        if (tokenId == 0) {
            return (
                false,
                false,
                Certificate(0, address(0), address(0), "", "", "", "", 0, false)
            );
        }

        Certificate memory cert = certificates[tokenId];
        return (true, cert.isValid, cert);
    }

    /**
     * @dev Get all certificates for a specific user
     * @param user Address of the user
     * @return Certificate array containing all user's certificates
     */
    function getUserCertificates(
        address user
    ) public view returns (Certificate[] memory) {
        uint256[] memory tokenIds = userCertificates[user];
        Certificate[] memory userCerts = new Certificate[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            userCerts[i] = certificates[tokenIds[i]];
        }

        return userCerts;
    }

    /**
     * @dev Revoke a certificate (issuer only)
     * @param tokenId Token ID of the certificate to revoke
     */
    function revokeCertificate(uint256 tokenId) public {
        require(_ownerOf(tokenId) != address(0), "Certificate does not exist");

        Certificate storage cert = certificates[tokenId];
        require(
            cert.issuer == msg.sender,
            "Only original issuer can revoke certificate"
        );
        require(cert.isValid, "Certificate is already revoked");

        cert.isValid = false;
        emit CertificateRevoked(tokenId, msg.sender);
    }

    /**
     * @dev Get total number of certificates issued
     * @return Total certificate count
     */
    function getTotalCertificates() public view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Grant issuer role to an address (admin only)
     * @param account Address to grant issuer role
     */
    function grantIssuerRole(address account) public onlyRole(ADMIN_ROLE) {
        _grantRole(ISSUER_ROLE, account);
    }

    /**
     * @dev Revoke issuer role from an address (admin only)
     * @param account Address to revoke issuer role
     */
    function revokeIssuerRole(address account) public onlyRole(ADMIN_ROLE) {
        _revokeRole(ISSUER_ROLE, account);
    }

    /**
     * @dev Check if an address has admin role
     * @param account Address to check
     * @return Whether the address has admin role
     */
    function isAdmin(address account) public view returns (bool) {
        return hasRole(ADMIN_ROLE, account);
    }

    /**
     * @dev Check if an address has issuer role
     * @param account Address to check
     * @return Whether the address has issuer role
     */
    function isIssuer(address account) public view returns (bool) {
        return hasRole(ISSUER_ROLE, account);
    }

    // Override required functions
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        return super._update(to, tokenId, auth);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
