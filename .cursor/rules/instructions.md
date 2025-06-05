# Blockchain-Based Certificate Management Web App PRD

## Overview

This web application is a decentralized platform for managing digital certificates using blockchain technology. Organizations (issuers) can create and issue certificates to users (holders), who can then share them with others (verifiers) for validation. The system ensures certificate authenticity and immutability through blockchain integration and decentralized IPFS storage.

## Key Technologies:

- Ethereum, Solidity, Truffle, Metamask, Next.js, Tailwind CSS, Shadcn UI, Lucid Icons, Ethers.js, MySQL, IPFS, Ganache, Mocha/Chai, ERC721

## User Roles

1. Admin: Manages issuers and oversees the system.
2. Issuer (e.g., University): Issues certificates to holders.
3. Holder (e.g., Student): Receives and manages certificates.
4. Verifier (e.g., Company): Verifies certificates (no login required).

## Core Functionalities

### Authentication and Access Control

- All users except verifiers must connect their MetaMask wallet to access the platform.
- Role-based access control for Admins, Issuers, and Holders.
- Public access for Verifiers (no wallet required).

### Admin Features

- Add/remove Issuers by wallet address.
- View all Holders and Issuers, including wallet addresses and activity logs.
- Monitor certificate issuance and verification activities.

### Issuer Features

- Bulk certificate generation via Excel upload.
- Integrated certificate designer with template upload and element positioning.
- Upload certificates to IPFS for decentralized storage.
- Issue certificates to Holders by wallet address and certificate details.
- Record certificate issuance on the blockchain.

### Holder Features

- View and edit personal profile information.
- View all certificates issued to them, including IPFS hash.
- Download certificates in multiple formats (PDF, JPEG, PNG).
- Generate QR codes for certificate sharing.
- Share certificates via links pointing to IPFS storage.
- Monitor certificate status (pending, issued, verified, rejected).

### Verifier Features

- Verify certificates by entering hash or scanning QR code.
- Display verification results (valid/invalid, issuer details).
- No wallet connection required.

## Technical Stack and Integrations

1. Blockchain Layer:

   - Ethereum: For blockchain infrastructure.

2. Smart Contract Development:

   - Solidity: For smart contract logic (certificate issuance, verification, management).
   - Truffle: For local development, testing (with Mocha/Chai), and deployment of smart contracts.
   - Ganache: For local blockchain development and testing.

3. Wallets and Authentication:

   - MetaMask: For wallet connection and authentication for all users except verifiers.

4. Front-End Development:

   - Next.js: For a fast, server-rendered React application.
   - Tailwind CSS: For responsive and modern UI design.
   - Shadcn UI: For base UI components, which may be extended or customized as needed.
   - Lucid Icons: For consistent UI icons throughout the application.
   - Ethers.js: For interacting with smart contracts from the frontend, especially with MetaMask wallet integration.

5. Storage Solutions:

   - MySQL: For storing user data (profiles, roles) and activity logs.
   - IPFS: For decentralized storage of certificate files.

6. Testing & Debugging Tools:

   - Mocha: A JavaScript test framework for running smart contract tests.
   - Chai: An assertion library for testing smart contracts.
   - Ganache: A personal Ethereum blockchain for development and testing.

7. Governance & Token Standard:

   - ERC721: The standard for non-fungible tokens (NFTs).

# Additional Considerations

1. Security

   - Use role-based access control (RBAC) in smart contracts and frontend.
   - Store sensitive user data securely in MySQL.
   - Only authorized issuers can upload files to IPFS (enforced via smart contract).

2. User Experience

   - Provide onboarding for MetaMask setup and wallet interactions.
   - Include a drag-and-drop certificate generator with customizable templates for issuers.
   - Generate QR codes for each certificate, linking to the verification page with the IPFS hash.

3. Performance and Scalability

   - Use efficient contract design to optimize gas costs.
   - Implement pagination for large lists (certificates, users) in the UI and MySQL queries.

## Documentation

1. Smart Contract Functions

   - issueCertificate(address \_user, string \_ipfsHash, string \_certType): Issues a certificate with the IPFS hash (Issuer only).
   - verifyCertificate(string \_ipfsHash): Verifies a certificate by its IPFS hash (public).
   - getUserCertificates(address \_user): Retrieves a user’s certificates, including IPFS hashes.

2. Frontend Routes

   - /: Home page.
   - /login: Login page.
   - /admin: Admin dashboard.
   - /issuer: Issuer dashboard.
   - /holder: Holder dashboard.
   - /verify: Public verification page.

## Glossary / Tooling Table

| Tool/Library | Purpose                                    | Used In        |
| ------------ | ------------------------------------------ | -------------- |
| Ethereum     | Blockchain Layer                           | Blockchain     |
| Solidity     | Smart contract logic                       | Blockchain     |
| Truffle      | Contract development, testing, deployment  | Blockchain     |
| MetaMask     | Wallet connection/authentication           | Frontend       |
| Next.js      | Server-rendered React application          | Frontend       |
| Tailwind CSS | UI styling                                 | Frontend       |
| Shadcn UI    | Base UI components (customizable)          | Frontend       |
| Lucid Icons  | Consistent UI icons                        | Frontend       |
| Ethers.js    | Contract interaction, MetaMask integration | Frontend       |
| MySQL        | User data, roles, activity logs            | Backend/DB     |
| IPFS         | Decentralized file storage                 | Frontend/Infra |
| Ganache      | Local blockchain development and testing   | Blockchain     |
| Mocha/Chai   | Smart contract testing                     | Blockchain     |
| ERC721       | Standard for non-fungible tokens           | Blockchain     |
