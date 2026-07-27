package ca.mohawkCollege.wiselySplitServer.jpa.services;

import ca.mohawkCollege.wiselySplitServer.exceptions.DuplicateUserException;
import ca.mohawkCollege.wiselySplitServer.exceptions.UserNotFoundException;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.UserDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.WalletDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.User;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.Wallet;
import ca.mohawkCollege.wiselySplitServer.jpa.repositories.WalletRepo;
import ca.mohawkCollege.wiselySplitServer.utilities.auth.ValidationUtil;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class WalletService {

    @Autowired
    private WalletRepo walletRepo;

    @Transactional
    public Map<String, Object> updateWallet(WalletDTO walletDTO) {
        Wallet walletToUpdate = walletRepo.findById(walletDTO.getWalletId())
                .orElseThrow(()-> new NullPointerException("Wallet with ID:" + walletDTO.getWalletId() + " not found"));
            walletToUpdate.setName(walletDTO.getName());
            walletToUpdate.setCardName(walletDTO.getCardName());
            walletToUpdate.setColor(walletDTO.getColor());

            //swapping new InitialBalance with Old InitialBalance in balance
            double balanceWithOutInitialBalance = walletToUpdate.getBalance()-walletToUpdate.getInitialBalance();
            double balanceWithNewInitialBalance = balanceWithOutInitialBalance + walletDTO.getInitialBalance();
            walletToUpdate.setBalance(balanceWithNewInitialBalance);

            walletToUpdate.setInitialBalance(walletDTO.getInitialBalance());
            walletRepo.save(walletToUpdate);

            return Map.of("success", true, "walletId", walletToUpdate.getWalletId(), "message", "Wallet updated successfully");
    }
}