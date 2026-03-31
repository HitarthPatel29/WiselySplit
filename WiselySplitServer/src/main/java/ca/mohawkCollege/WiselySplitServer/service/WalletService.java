package ca.mohawkCollege.WiselySplitServer.service;

import ca.mohawkCollege.WiselySplitServer.dao.WalletDAO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class WalletService {
    @Autowired
    private WalletDAO walletDAO;

    @Transactional
    public Map<String, Object> createWallet(int userId, Map<String, Object> payload) {
        try {
            String walletName = (String) payload.get("walletName");
            double walletBalance = ((Number) payload.get("walletBalance")).doubleValue();
            String walletType = (String) payload.get("walletType");
            String walletColor = (String) payload.get("walletColor");


            // Insert into Expenses table
            int walletId = walletDAO.insertWallet(userId, walletName, walletBalance, walletType, walletColor);

            return Map.of("success", true, "walletId", walletId, "message", "New Wallet created successfully");
        } catch (Exception e) {
            throw new RuntimeException("Error creating new wallet: " + e.getMessage());
        }
    }

    public List<Map<String, Object>> getWallets(int userId) {
        return walletDAO.getWallets(userId);
    }

    public Map<String, Object> updateWallet(int userId, int walletId, Map<String, Object> payload) {
        try{
            String walletName = (String) payload.get("walletName");
            double walletBalance = ((Number) payload.get("walletBalance")).doubleValue();
            String cardName = (String) payload.get("cardName");
            String walletColor = (String) payload.get("walletColor");

            walletDAO.updateWallet(userId, walletId, walletName, walletBalance, cardName, walletColor);

            return Map.of("success", true, "walletId", walletId, "message", "Wallet updated successfully");
        } catch (Exception e) {
            throw new RuntimeException("Error updating wallet: " + e.getMessage());
        }
    }

    public void deleteWallet(int userId, int walletId) {
        walletDAO.deleteWallet(userId, walletId);
    }

}
