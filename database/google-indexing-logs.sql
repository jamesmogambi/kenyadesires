-- Google Indexing API tracking table
-- Run this in phpMyAdmin > SQL console on the cPanel MySQL database.

CREATE TABLE IF NOT EXISTS google_indexing_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(512) NOT NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
    action_type ENUM('URL_UPDATED', 'URL_DELETED') DEFAULT 'URL_UPDATED',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT NULL,
    INDEX idx_quota (requested_at, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
