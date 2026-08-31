package ca.mohawk_college.wiselysplit_server.models;

import java.sql.Timestamp;

public class Invite {
    private long inviteId;
    private long senderId;
    private Long receiverId;
    private String receiverEmail;
    private Long groupId;
    private String type;   // USER or GROUP
    private String status; // PENDING, ACCEPTED, REJECTED, EXPIRED
    private Timestamp createdAt;
    private Timestamp expiresAt;

    public Invite() {}

    public long getInviteId() { return inviteId; }
    public void setInviteId(long inviteId) { this.inviteId = inviteId; }

    public long getSenderId() { return senderId; }
    public void setSenderId(long senderId) { this.senderId = senderId; }

    public Long getReceiverId() { return receiverId; }
    public void setReceiverId(Long receiverId) { this.receiverId = receiverId; }

    public String getReceiverEmail() { return receiverEmail; }
    public void setReceiverEmail(String receiverEmail) { this.receiverEmail = receiverEmail; }

    public Long getGroupId() { return groupId; }
    public void setGroupId(Long groupId) { this.groupId = groupId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Timestamp expiresAt) { this.expiresAt = expiresAt; }
}