package ca.mohawkCollege.wiselySplitServer.jpa.repositories;

import ca.mohawkCollege.wiselySplitServer.jpa.entities.User;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface WalletRepo extends JpaRepository<Wallet, Long> {

}
