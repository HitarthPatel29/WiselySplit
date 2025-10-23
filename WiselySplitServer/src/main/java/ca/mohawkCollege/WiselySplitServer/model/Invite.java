package ca.mohawkCollege.WiselySplitServer.model;

import java.sql.Timestamp;

public class Invite {
    private int inviteId;
    private int senderId;
    private Integer receiverId;
    private String receiverEmail;
    private Integer groupId;
    private String type;   // USER or GROUP
    private String status; // PENDING, ACCEPTED, REJECTED, EXPIRED
    private Timestamp createdAt;
    private Timestamp expiresAt;

    public Invite() {}

    public int getInviteId() { return inviteId; }
    public void setInviteId(int inviteId) { this.inviteId = inviteId; }

    public int getSenderId() { return senderId; }
    public void setSenderId(int senderId) { this.senderId = senderId; }

    public Integer getReceiverId() { return receiverId; }
    public void setReceiverId(Integer receiverId) { this.receiverId = receiverId; }

    public String getReceiverEmail() { return receiverEmail; }
    public void setReceiverEmail(String receiverEmail) { this.receiverEmail = receiverEmail; }

    public Integer getGroupId() { return groupId; }
    public void setGroupId(Integer groupId) { this.groupId = groupId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Timestamp expiresAt) { this.expiresAt = expiresAt; }
}