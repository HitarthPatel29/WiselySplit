package ca.mohawk_college.wiselysplit_server.jpa.repositories;

import ca.mohawk_college.wiselysplit_server.jpa.entities.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WalletRepo extends JpaRepository<Wallet, Long> {

    @Query("select w from Wallet w where replace(upper(w.cardName), ' ', '') LIKE replace(upper(?1), ' ', '') and w.user.userId = ?2")
    Optional<Wallet> findByCardNameAndUserID(String cardName, Long userId);

    boolean existsByWalletIdAndUser_UserId(Long walletId, Long userId);



}
