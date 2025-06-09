-- Create activity_logs table for comprehensive activity tracking
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(100) NOT NULL COMMENT 'Type of activity (CERTIFICATE_ISSUED, USER_LOGIN, ROLE_GRANTED, etc.)',
    wallet_address VARCHAR(42) NOT NULL COMMENT 'Wallet address that performed the action',
    target_address VARCHAR(42) NULL COMMENT 'Target wallet address (for transfers, role grants, etc.)',
    details TEXT NULL COMMENT 'Human-readable description of the activity',
    transaction_hash VARCHAR(66) NULL COMMENT 'Blockchain transaction hash (if applicable)',
    block_number BIGINT NULL COMMENT 'Block number (if blockchain transaction)',
    token_id VARCHAR(100) NULL COMMENT 'Certificate token ID (if applicable)',
    ipfs_hash VARCHAR(100) NULL COMMENT 'IPFS hash (if applicable)',
    metadata JSON NULL COMMENT 'Additional structured data',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_target_address (target_address),
    INDEX idx_created_at (created_at),
    INDEX idx_transaction_hash (transaction_hash),
    INDEX idx_token_id (token_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Activity logs for blockchain certificate system';
-- Insert some sample data for testing
INSERT INTO activity_logs (
        type,
        wallet_address,
        target_address,
        details,
        transaction_hash,
        block_number,
        token_id,
        ipfs_hash,
        metadata
    )
VALUES (
        'CERTIFICATE_ISSUED',
        '0x241dBc6d5f283964536A94e33E2323B7580CE45A',
        '0x6ae5FfE48c1395260cF096134E5e32725c24080a',
        'Certificate issued to recipient',
        '0xf4ec4bba21e2ead81719b41e1bce37d06f6b4cfe33de0d2b5ae871601075f567',
        3,
        '1',
        'QmHash123...',
        '{"certificateType": "Completion", "institutionName": "Blockchain University"}'
    ),
    (
        'ROLE_GRANTED',
        '0x241dBc6d5f283964536A94e33E2323B7580CE45A',
        '0x6ae5FfE48c1395260cF096134E5e32725c24080a',
        'ISSUER role granted to user',
        '0xf4ec4bba21e2ead81719b41e1bce37d06f6b4cfe33de0d2b5ae871601075f567',
        3,
        NULL,
        NULL,
        '{"roleType": "ISSUER", "grantedBy": "admin"}'
    ),
    (
        'USER_LOGIN',
        '0x6ae5FfE48c1395260cF096134E5e32725c24080a',
        NULL,
        'User connected wallet and logged in',
        NULL,
        NULL,
        NULL,
        NULL,
        '{"userAgent": "MetaMask", "loginMethod": "wallet"}'
    ),
    (
        'CONTRACT_DEPLOYED',
        '0x241dBc6d5f283964536A94e33E2323B7580CE45A',
        NULL,
        'CertificateNFT contract deployed',
        '0x123...',
        2,
        NULL,
        NULL,
        '{"contractAddress": "0x80D393B7e5706523C26ECabA90a996f2574A7b53", "network": "ganache"}'
    );
-- Create indexes for better performance
-- (already included in table creation above)