package ca.mohawk_college.wiselysplit_server.jpa.repositories;

import ca.mohawk_college.wiselysplit_server.jpa.entities.GroupParticipation;
import ca.mohawk_college.wiselysplit_server.jpa.entities.GroupParticipationId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupParticipationRepo extends JpaRepository<GroupParticipation, GroupParticipationId> {
}
