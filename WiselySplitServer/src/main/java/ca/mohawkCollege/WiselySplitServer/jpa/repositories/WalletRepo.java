package ca.mohawkCollege.wiselySplitServer.jpa.repositories;

import ca.mohawkCollege.wiselySplitServer.jpa.entities.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface WalletRepo extends JpaRepository<Wallet, Integer> {
    List<Map<String, Object>> findAllWalletsByUserId(int userId);

    @Query("UPDATE Wallet w SET w.name= :wallet.name, w.balance=wallet")
    void update(Wallet wallet);
}
