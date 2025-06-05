-- Blockchain Certificate Management Web App Database Schema
-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS certchain;
-- Use the database
USE certchain;
-- Drop tables if they exist (for clean reinstallation)
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS users;
-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    role ENUM('admin', 'issuer', 'holder') NOT NULL,
    username VARCHAR(255),
    email VARCHAR(255),
    profile_image VARCHAR(255),
    created_at DATETIME NOT NULL,
    last_active DATETIME NOT NULL,
    INDEX wallet_idx (wallet_address),
    INDEX role_idx (role)
);
-- Activity Logs Table
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    wallet_address VARCHAR(42),
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE
    SET NULL,
        INDEX action_idx (action),
        INDEX created_idx (created_at)
);
-- Certificates Table
CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ipfs_hash VARCHAR(255) NOT NULL UNIQUE,
    token_id VARCHAR(255) UNIQUE,
    issuer_id INT NOT NULL,
    holder_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    issue_date DATETIME NOT NULL,
    status ENUM('pending', 'issued', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    metadata JSON,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (issuer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (holder_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX status_idx (status),
    INDEX ipfs_idx (ipfs_hash)
);
-- Insert default admin user (replace with actual admin wallet address)
INSERT INTO users (
        wallet_address,
        role,
        username,
        created_at,
        last_active
    )
VALUES (
        '0x88fd1ecd3fd9a408ded64c6ee69764f7f997ab48',
        'admin',
        'System Admin',
        NOW(),
        NOW()
    );