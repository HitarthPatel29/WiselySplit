package ca.mohawk_college.wiselysplit_server.jpa.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "ExpenseGroups")
public class ExpenseGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "GroupID", columnDefinition = "INT")
    private Long groupId;

    @Column(name = "GroupName", columnDefinition = "VARCHAR")
    private String groupName;

    @Column(name = "GroupType", columnDefinition = "VARCHAR")
    private String groupType;

    @Column(name = "ProfilePicture", columnDefinition = "VARCHAR")
    private String profilePicture;

    @ManyToMany(mappedBy = "groups")   // inverse side — doesn't own the join table, just points to the owning side
    private Set<User> participants = new HashSet<>();
}
