package ca.mohawk_college.wiselysplit_server.jpa.repositories;

import ca.mohawk_college.wiselysplit_server.jpa.entities.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepo extends JpaRepository<Payment, Long> {

    @Query("""
            SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END
            FROM Payment p
            WHERE p.paymentId = :paymentId
              AND (p.payer.userId = :userId OR p.receiver.userId = :userId)
            """)
    boolean existsByPaymentIdAndPartyUserId(@Param("paymentId") Long paymentId, @Param("userId") Long userId);
}
