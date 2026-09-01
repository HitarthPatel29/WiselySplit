package ca.mohawk_college.wiselysplit_server.jpa.repositories.entry;

import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Entry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EntryRepo extends JpaRepository<Entry, Long> {

    @Query(value = """
            SELECT * FROM Expenses
            WHERE WalletID = :walletId OR ToWalletID = :walletId
            """, nativeQuery = true)
    List<Entry> findAllByWallet(@Param("walletId") Long walletId);
}