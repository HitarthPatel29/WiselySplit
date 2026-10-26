-- refresh_token_migration.sql
-- Adds server-side refresh tokens (30-day login) to the WiselySplit MySQL database.
-- Access tokens stay stateless JWTs; only refresh tokens are persisted so they can be
-- rotated, checked for reuse and revoked. Run once against the database.

-- Only the SHA-256 hash of each refresh token is stored, never the raw value.
-- Each login creates a new FamilyID; every rotation of that login keeps the same
-- FamilyID and ExpiresAt, so revoking a family logs out exactly one session.
CREATE TABLE IF NOT EXISTS RefreshToken (
    TokenID      BIGINT PRIMARY KEY AUTO_INCREMENT,
    UserID       BIGINT       NOT NULL,
    TokenHash    CHAR(64)     NOT NULL UNIQUE,
    FamilyID     CHAR(36)     NOT NULL,
    Remember     BOOLEAN      NOT NULL DEFAULT FALSE,
    ExpiresAt    TIMESTAMP    NOT NULL,
    CreatedAt    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    RevokedAt    TIMESTAMP    NULL,
    ReplacedByID BIGINT       NULL,
    UserAgent    VARCHAR(255) NULL,
    IpAddress    VARCHAR(45)  NULL,
    FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE,
    INDEX idx_refresh_user (UserID),
    INDEX idx_refresh_family (FamilyID),
    INDEX idx_refresh_expires (ExpiresAt)
);
