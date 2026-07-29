package ca.mohawkCollege.wiselySplitServer.jpa.entities;

import ca.mohawkCollege.wiselySplitServer.jpa.constants.InviteStatus;
import ca.mohawkCollege.wiselySplitServer.jpa.constants.InviteType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "Invites")
public class Invite {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "InviteID")
    private Long inviteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SenderID", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ReceiverID", nullable = true)
    private User receiver;

    @Email(message = "Not a valid Email")
    @Column(name = "ReceiverEmail", nullable = false)
    private String receiverEmail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GroupID", nullable = true)
    private ExpenseGroup group;

    @Enumerated(EnumType.STRING)
    @Column(name = "Type", nullable = true)
    private InviteType type = InviteType.USER;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = true)
    private InviteStatus status = InviteStatus.PENDING;

    @Column(name = "CreatedAt", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "ExpiresAt", nullable = false, updatable = false)
    private Instant expiresAt = createdAt.plus(7, ChronoUnit.DAYS);
}
