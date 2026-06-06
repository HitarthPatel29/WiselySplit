-- rbac_migration.sql
-- Adds single-role RBAC support (ADMIN / TEST_PROFILE / USER) to the User table
-- plus a lightweight admin audit log. Run once against the WiselySplit MySQL database.

-- 1. Role column on User. Defaults every existing/new account to USER.
ALTER TABLE User
    ADD COLUMN Role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- 2. Bootstrap the first administrator.
--    Replace the email below with the real admin account email BEFORE running.
UPDATE User SET Role = 'ADMIN' WHERE Email = 'admin@wiselysplit.xyz';

-- 3. Admin audit log: records privileged admin actions (role changes, CRUD, resets).
CREATE TABLE IF NOT EXISTS admin_audit (
    Id           INT PRIMARY KEY AUTO_INCREMENT,
    ActorUserId  INT          NULL,
    ActorEmail   VARCHAR(255) NULL,
    Action       VARCHAR(64)  NOT NULL,
    TargetUserId INT          NULL,
    Details      VARCHAR(512) NULL,
    CreatedAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_audit_created (CreatedAt DESC),
    INDEX idx_admin_audit_target (TargetUserId)
);
