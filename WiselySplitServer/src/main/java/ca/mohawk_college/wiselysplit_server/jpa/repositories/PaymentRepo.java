package ca.mohawk_college.wiselysplit_server.jpa.repositories;

import ca.mohawk_college.wiselysplit_server.jpa.entities.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepo extends JpaRepository<Payment, Long> {

    @Query("""
            SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END
            FROM Payment p
            WHERE p.paymentId = ?1
              AND (p.payer.userId = ?2 OR p.receiver.userId = ?2)
            """)
    boolean existsByPaymentIdAndPartyUserId(Long paymentId, Long userId);
}
