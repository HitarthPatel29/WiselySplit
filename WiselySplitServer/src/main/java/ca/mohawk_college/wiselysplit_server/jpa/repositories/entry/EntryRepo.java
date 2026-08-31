package ca.mohawk_college.wiselysplit_server.jpa.repositories.entry;

import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Entry;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EntryRepo extends JpaRepository<Entry, Long> {

    List<Expense> findByWallet_WalletIdIsOrToWallet_WalletIdIs(Long walletId, Long walletId1);
}