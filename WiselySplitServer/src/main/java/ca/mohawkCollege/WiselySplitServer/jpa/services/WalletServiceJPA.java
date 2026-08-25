package ca.mohawkCollege.wiselySplitServer.jpa.services;

import ca.mohawkCollege.wiselySplitServer.jpa.dtos.wallet.WalletDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.Wallet;
import ca.mohawkCollege.wiselySplitServer.jpa.repositories.WalletRepo;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Service
public class WalletServiceJPA {

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
            BigDecimal balanceWithOutInitialBalance = walletToUpdate.getBalance().subtract(walletToUpdate.getInitialBalance());
            BigDecimal balanceWithNewInitialBalance = balanceWithOutInitialBalance.add(walletDTO.getInitialBalance());
            walletToUpdate.setBalance(balanceWithNewInitialBalance);

            walletToUpdate.setInitialBalance(walletDTO.getInitialBalance());
            walletRepo.save(walletToUpdate);

            return Map.of("success", true, "walletId", walletToUpdate.getWalletId(), "message", "Wallet updated successfully");
    }
}