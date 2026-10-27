package ca.mohawk_college.wiselysplit_server.models;

import java.time.LocalDateTime;

public class RefreshToken {
    private long tokenId;
    private long userId;
    private String tokenHash;
    private String familyId;
    private boolean remember;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime revokedAt;
    private Long replacedById;
    private String userAgent;
    private String ipAddress;

    // --- Getters and Setters ---
    public long getTokenId() { return tokenId; }
    public void setTokenId(long tokenId) { this.tokenId = tokenId; }

    public long getUserId() { return userId; }
    public void setUserId(long userId) { this.userId = userId; }

    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }

    public String getFamilyId() { return familyId; }
    public void setFamilyId(String familyId) { this.familyId = familyId; }

    public boolean isRemember() { return remember; }
    public void setRemember(boolean remember) { this.remember = remember; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getRevokedAt() { return revokedAt; }
    public void setRevokedAt(LocalDateTime revokedAt) { this.revokedAt = revokedAt; }

    public Long getReplacedById() { return replacedById; }
    public void setReplacedById(Long replacedById) { this.replacedById = replacedById; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public boolean isRevoked() { return revokedAt != null; }

    public boolean isExpired(LocalDateTime now) { return expiresAt.isBefore(now); }
}
