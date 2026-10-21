package ca.mohawk_college.wiselysplit_server.jpa.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * The GroupParticipants table has no PK in MariaDB; JPA requires an identifier,
 * so (UserID, GroupID) is treated as a composite key on the Java side only.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "GroupParticipants")
public class GroupParticipation {

    @EmbeddedId
    private GroupParticipationId id = new GroupParticipationId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "UserID", columnDefinition = "BIGINT", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("groupId")
    @JoinColumn(name = "GroupID", columnDefinition = "INT", nullable = false)
    private ExpenseGroup group;

    public GroupParticipation(User user, ExpenseGroup group) {
        this.user = user;
        this.group = group;
        this.id = new GroupParticipationId(user.getUserId(), group.getGroupId());
    }
}
