package ca.mohawk_college.wiselysplit_server.jpa.repositories;

import ca.mohawk_college.wiselysplit_server.jpa.entities.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseRepo extends JpaRepository<Expense, Long> {

//    @Query("select e from Expense e where e.wallet = ?1 or e.toWallet = ?1")
//    List<Expense> findAllByWalletOrToWallet(Wallet wallet);

    List<Expense> findByWallet_WalletIdIsOrToWallet_WalletIdIs(Long walletId, Long walletId1);
}
