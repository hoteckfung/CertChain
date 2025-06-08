-- Create holder_profiles table for storing user profile information
CREATE TABLE IF NOT EXISTS holder_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(20),
    privacy_settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);
-- Insert some sample data for testing
INSERT INTO holder_profiles (
        wallet_address,
        full_name,
        email,
        phone_number,
        privacy_settings
    )
VALUES (
        '0xd8f24d419153e5d03d614c5155f900f4b5c8a65a',
        'John Doe',
        'john.doe@example.com',
        '+1 (555) 123-4567',
        '{"public_profile": true, "show_certificates_publicly": true, "receive_notifications": true}'
    ) ON DUPLICATE KEY
UPDATE full_name =
VALUES(full_name),
    email =
VALUES(email),
    phone_number =
VALUES(phone_number),
    privacy_settings =
VALUES(privacy_settings),
    updated_at = CURRENT_TIMESTAMP;