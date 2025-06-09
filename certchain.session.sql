-- Enhanced Blockchain Certificate Management Web App Database Schema
-- Includes permissions, session management, and audit improvements
CREATE DATABASE IF NOT EXISTS certchain;
USE certchain;
-- Drop tables if they exist (for clean reinstallation)
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS users;
-- Enhanced Users Table with permissions and session tracking
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    role ENUM('admin', 'issuer', 'holder') NOT NULL,
    username VARCHAR(255),
    email VARCHAR(255),
    profile_image VARCHAR(255),
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    last_active DATETIME NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX wallet_idx (wallet_address),
    INDEX role_idx (role),
    INDEX active_idx (is_active)
);
-- User Sessions Table for better session management
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX user_idx (user_id),
    INDEX token_idx (session_token),
    INDEX expires_idx (expires_at)
);
-- Enhanced Activity Logs Table
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    wallet_address VARCHAR(42),
    ip_address VARCHAR(45),
    user_agent TEXT,
    severity ENUM('info', 'warning', 'error') DEFAULT 'info',
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE
    SET NULL,
        INDEX user_idx (user_id),
        INDEX action_idx (action),
        INDEX created_idx (created_at),
        INDEX severity_idx (severity)
);
-- Certificates Table (enhanced)
CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ipfs_hash VARCHAR(255) NOT NULL UNIQUE,
    token_id VARCHAR(255) UNIQUE,
    issuer_id INT NOT NULL,
    holder_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    issue_date DATETIME NOT NULL,
    expiry_date DATETIME,
    status ENUM(
        'pending',
        'issued',
        'verified',
        'rejected',
        'revoked'
    ) NOT NULL DEFAULT 'pending',
    metadata JSON,
    verification_count INT DEFAULT 0,
    last_verified DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (issuer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (holder_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX status_idx (status),
    INDEX ipfs_idx (ipfs_hash),
    INDEX issue_date_idx (issue_date),
    INDEX expiry_idx (expiry_date)
);
-- Insert default admin user with enhanced permissions
INSERT INTO users (
        wallet_address,
        role,
        username,
        permissions,
        created_at,
        last_active
    )
VALUES (
        '0x241dBc6d5f283964536A94e33E2323B7580CE45A',
        'admin',
        'System Admin',
        JSON_ARRAY(
            'manage_users',
            'issue_certificates',
            'verify_certificates',
            'view_analytics',
            'manage_system'
        ),
        NOW(),
        NOW()
    );
-- Insert additional test users
INSERT INTO users (
        wallet_address,
        role,
        username,
        permissions,
        created_at,
        last_active
    )
VALUES (
        '0x6ae5FfE48c1395260cF096134E5e32725c24080a',
        'issuer',
        'Test Issuer',
        JSON_ARRAY('issue_certificates', 'verify_certificates'),
        NOW(),
        NOW()
    );
INSERT INTO users (
        wallet_address,
        role,
        username,
        permissions,
        created_at,
        last_active
    )
VALUES (
        '0x01178ee99F7E50957Ab591b0C7ca307E593254C9',
        'holder',
        'Test Holder',
        JSON_ARRAY('view_certificates'),
        NOW(),
        NOW()
    );
-- Create indexes for better performance
CREATE INDEX idx_user_role_active ON users(role, is_active);
CREATE INDEX idx_activity_user_date ON activity_logs(user_id, created_at);
CREATE INDEX idx_certificates_status_date ON certificates(status, created_at); 