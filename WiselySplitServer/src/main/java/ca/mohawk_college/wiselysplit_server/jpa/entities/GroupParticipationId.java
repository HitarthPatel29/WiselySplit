package ca.mohawk_college.wiselysplit_server.jpa.entities;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@NoArgsConstructor
@AllArgsConstructor
@Data
public class GroupParticipationId implements Serializable {

    private Long userId;
    private Long groupId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof GroupParticipationId)) return false;
        GroupParticipationId that = (GroupParticipationId) o;
        return Objects.equals(userId, that.userId)
                && Objects.equals(groupId, that.groupId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, groupId);
    }
}
