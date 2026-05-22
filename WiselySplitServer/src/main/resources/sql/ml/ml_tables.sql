-- ml_tables.sql
-- Tables that power the SMILE-based expense title -> category classifier.
-- Run this once against the WiselySplit MySQL database.

CREATE TABLE IF NOT EXISTS training_data (
    Id        INT PRIMARY KEY AUTO_INCREMENT,
    Title     VARCHAR(255) NOT NULL,
    Label     VARCHAR(64)  NOT NULL,
    Source    ENUM('seed','user_confirmed','user_corrected') NOT NULL DEFAULT 'user_confirmed',
    UserID    INT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_training_label (Label),
    INDEX idx_training_created (CreatedAt)
);

CREATE TABLE IF NOT EXISTS model_store (
    ModelID      INT PRIMARY KEY AUTO_INCREMENT,
    Version      INT NOT NULL,
    Algorithm    VARCHAR(32) NOT NULL DEFAULT 'NaiveBayes',
    ModelBlob    LONGBLOB    NOT NULL,
    Classes      TEXT        NOT NULL,
    TrainingSize INT         NOT NULL,
    CreatedAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_model_version (Version DESC)
);
