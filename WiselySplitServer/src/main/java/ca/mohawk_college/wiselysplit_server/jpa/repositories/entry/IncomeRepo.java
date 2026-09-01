package ca.mohawk_college.wiselysplit_server.jpa.repositories.entry;

import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Income;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface IncomeRepo extends JpaRepository<Income, Long> {

    @Query("select i from Income i where i.user.userId = ?1 and i.date between ?2 and ?3")
    List<Income> findAllByUserIdAndDateRange(Long userId, LocalDate dateStart, LocalDate dateEnd);


}
