package ca.mohawkCollege.wiselySplitServer.jpa.repositories;

import ca.mohawkCollege.wiselySplitServer.jpa.entities.ExpenseGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpenseGroupRepo extends JpaRepository<ExpenseGroup, Long> {
}
