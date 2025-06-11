-- ============================================================================
-- CERTCHAIN DATABASE SETUP - CLEAN VERSION (NO SAMPLE DATA)
-- ============================================================================
-- This creates empty tables for testing real data insertion from the website
-- Execute this in phpMyAdmin or MySQL command line
-- ============================================================================
CREATE DATABASE IF NOT EXISTS certchain;
USE certchain;
-- Disable foreign key checks temporarily for clean setup
SET FOREIGN_KEY_CHECKS = 0;
-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS users;
-- Drop existing views
DROP VIEW IF EXISTS admin_certificate_activity;
DROP VIEW IF EXISTS admin_user_overview;
-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    role ENUM('issuer', 'holder') NOT NULL DEFAULT 'holder',
    permissions JSON NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_role (role),
    INDEX idx_active (is_active),
    INDEX idx_last_active (last_active)
);
-- ============================================================================
-- 2. CERTIFICATES TABLE
-- ============================================================================
CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_id VARCHAR(255) UNIQUE,
    ipfs_hash VARCHAR(255) NOT NULL UNIQUE,
    issuer_id INT NOT NULL,
    holder_id INT NOT NULL,
    issuer_wallet VARCHAR(42) NOT NULL,
    holder_wallet VARCHAR(42) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    issue_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('issued', 'revoked') NOT NULL DEFAULT 'issued',
    transaction_hash VARCHAR(66) NULL,
    block_number BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issuer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (holder_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_issuer_wallet (issuer_wallet),
    INDEX idx_holder_wallet (holder_wallet),
    INDEX idx_token_id (token_id),
    INDEX idx_ipfs_hash (ipfs_hash),
    INDEX idx_issue_date (issue_date),
    INDEX idx_transaction_hash (transaction_hash)
);
-- ============================================================================
-- 3. ACTIVITY_LOGS TABLE
-- ============================================================================
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type ENUM(
        'user',
        'certificate',
        'role',
        'session',
        'system'
    ) NOT NULL DEFAULT 'system',
    entity_id VARCHAR(255) NULL,
    details TEXT NULL,
    -- Wallet addresses involved in the action
    wallet_address VARCHAR(42) NULL,
    target_wallet_address VARCHAR(42) NULL,
    -- Certificate-specific fields
    certificate_id INT NULL,
    token_id VARCHAR(255) NULL,
    ipfs_hash VARCHAR(255) NULL,
    -- Blockchain-specific fields
    transaction_hash VARCHAR(66) NULL,
    block_number BIGINT NULL,
    -- Categorization
    category ENUM(
        'authentication',
        'authorization',
        'certificate_management',
        'user_management',
        'blockchain_interaction',
        'system_event'
    ) DEFAULT 'system_event',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE
    SET NULL,
        FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE
    SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_entity_type (entity_type),
        INDEX idx_wallet_address (wallet_address),
        INDEX idx_target_wallet_address (target_wallet_address),
        INDEX idx_certificate_id (certificate_id),
        INDEX idx_created_at (created_at),
        INDEX idx_category (category),
        INDEX idx_transaction_hash (transaction_hash)
);
-- ============================================================================
-- 4. USER_SESSIONS TABLE
-- ============================================================================
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    wallet_address VARCHAR(42) NOT NULL,
    login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logout_time DATETIME NULL,
    is_active BOOLEAN DEFAULT TRUE,
    session_duration_minutes INT GENERATED ALWAYS AS (
        CASE
            WHEN logout_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, login_time, logout_time)
            ELSE TIMESTAMPDIFF(MINUTE, login_time, last_activity)
        END
    ) STORED,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_login_time (login_time),
    INDEX idx_is_active (is_active)
);
-- ============================================================================
-- 5. ADMIN DASHBOARD VIEWS
-- ============================================================================
-- View: User Overview with Certificate Counts and Session Info
CREATE VIEW admin_user_overview AS
SELECT u.id,
    u.wallet_address,
    u.role,
    u.is_active,
    u.created_at,
    u.last_active,
    -- Certificate counts (only for holders)
    CASE
        WHEN u.role = 'holder' THEN COALESCE(cert_stats.certificate_count, 0)
        ELSE NULL
    END as certificate_count,
    -- Session info (most recent)
    latest_session.login_time as last_login,
    latest_session.session_duration_minutes as last_session_duration,
    -- Activity stats
    COALESCE(activity_stats.total_activities, 0) as total_activities,
    activity_stats.last_activity_date
FROM users u -- Certificate counts for holders
    LEFT JOIN (
        SELECT holder_id,
            COUNT(*) as certificate_count
        FROM certificates
        GROUP BY holder_id
    ) cert_stats ON u.id = cert_stats.holder_id
    AND u.role = 'holder' -- Latest session info
    LEFT JOIN (
        SELECT user_id,
            login_time,
            session_duration_minutes,
            ROW_NUMBER() OVER (
                PARTITION BY user_id
                ORDER BY login_time DESC
            ) as rn
        FROM user_sessions
    ) latest_session ON u.id = latest_session.user_id
    AND latest_session.rn = 1 -- Activity statistics
    LEFT JOIN (
        SELECT user_id,
            COUNT(*) as total_activities,
            MAX(created_at) as last_activity_date
        FROM activity_logs
        WHERE user_id IS NOT NULL
        GROUP BY user_id
    ) activity_stats ON u.id = activity_stats.user_id
ORDER BY u.created_at DESC;
-- View: Certificate Activity (which addresses issued to which addresses)
CREATE VIEW admin_certificate_activity AS
SELECT c.id as certificate_id,
    c.token_id,
    c.title,
    c.status,
    c.issue_date,
    -- Issuer information
    issuer.wallet_address as issuer_wallet,
    issuer.role as issuer_role,
    -- Holder information
    holder.wallet_address as holder_wallet,
    -- Activity log information
    al.created_at as activity_timestamp,
    al.transaction_hash,
    al.block_number,
    al.details as activity_details
FROM certificates c
    LEFT JOIN users issuer ON c.issuer_id = issuer.id
    LEFT JOIN users holder ON c.holder_id = holder.id
    LEFT JOIN activity_logs al ON c.id = al.certificate_id
    AND al.action IN (
        'certificate_issued',
        'certificate_verified',
        'certificate_revoked'
    )
ORDER BY c.issue_date DESC;
-- ============================================================================
-- 6. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX idx_user_role_active ON users(role, is_active);
CREATE INDEX idx_activity_user_date ON activity_logs(user_id, created_at);
CREATE INDEX idx_certificates_status_date ON certificates(status, created_at);
CREATE INDEX idx_sessions_user_active ON user_sessions(user_id, is_active);
-- ============================================================================
-- 7. VERIFICATION
-- ============================================================================
SELECT 'Clean database setup complete!' as status;
SELECT COUNT(*) as total_users
FROM users;
SELECT COUNT(*) as total_certificates
FROM certificates;
SELECT COUNT(*) as total_activities
FROM activity_logs;
SELECT COUNT(*) as total_sessions
FROM user_sessions;
SELECT 'Admin dashboard views created successfully!' as views_status;
-- ============================================================================
-- 8. READY FOR TESTING
-- ============================================================================
-- Tables are now empty and ready to test real data insertion from your website:
-- ✅ User auto-detection when connecting wallets
-- ✅ Certificate issuance from blockchain
-- ✅ Activity logging from user actions
-- ✅ Session tracking from login/logout
-- ============================================================================