package ca.mohawkCollege.wiselySplitServer.services.entry;

import ca.mohawkCollege.wiselySplitServer.daos.ExpensesDAO;
import ca.mohawkCollege.wiselySplitServer.daos.WalletDAO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
@Service
public class TransferService {

    @Autowired
    private ExpensesDAO expensesDAO;

    @Autowired
    private WalletDAO walletDAO;

    @Transactional
    public Map<String, Object> createTransfer(Map<String, Object> payload) {
        try {
            String title = (String) payload.get("title");
            String date = (String) payload.get("date");
            String type = (String) payload.get("category");
            double amount = ((Number) payload.get("amount")).doubleValue();
            int userId = ((Number) payload.get("userId")).intValue();
            Integer walletId = payload.get("walletId") != null ? ((Number) payload.get("walletId")).intValue() : null;
            Integer toWalletId = payload.get("toWalletId") != null ? ((Number) payload.get("toWalletId")).intValue() : null;

            if (null != walletId && null != toWalletId ){
                walletDAO.updateWalletBalance(userId, walletId, amount, WalletDAO.WalletBalanceUpdateMode.EXPENSE);
                walletDAO.updateWalletBalance(userId, toWalletId, amount, WalletDAO.WalletBalanceUpdateMode.INCOME);
            }
            int transferId = expensesDAO.insertPersonalExpense(title, date, type, amount, userId, walletId, "transfer", toWalletId);

            return Map.of("success", true, "transferId", transferId, "message", "Personal entry created successfully");
        } catch (Exception e) {
            throw new RuntimeException("Error creating personal transfer: " + e.getMessage());
        }
    }


    /**  Fetch single transfer details */
    public Map<String, Object> getTransferDetails(int transferId) {
        return expensesDAO.findExpenseById(transferId);
    }

    /**  Delete transfer */
    public void deleteTransfer(int transferId) {
        walletDAO.updateWalletBalanceForTransferDelete(transferId);
        expensesDAO.deleteExpense(transferId);
    }

    @Transactional
    public Map<String, Object> updateTransfer(int transferId, Map<String, Object> payload) {
        try {
            String title = (String) payload.get("title");
            String date = (String) payload.get("date");
            String type = (String) payload.get("category");
            double amount = ((Number) payload.get("amount")).doubleValue();
            int userId = ((Number) payload.get("userId")).intValue();

            Integer walletId = payload.get("walletId") != null ? ((Number) payload.get("walletId")).intValue() : null;
            Integer toWalletId = payload.get("toWalletId") != null ? ((Number) payload.get("toWalletId")).intValue() : null;

            if (null != walletId && null != toWalletId ){
                walletDAO.updateWalletBalanceForEntryUpdate(userId, walletId, transferId, amount, WalletDAO.WalletBalanceUpdateMode.EXPENSE);
                walletDAO.updateWalletBalanceForEntryUpdate(userId, toWalletId, transferId, amount, WalletDAO.WalletBalanceUpdateMode.INCOME);
            }

            expensesDAO.updateExpense(transferId, title, date, type, amount, userId, null, true, walletId, "transfer", toWalletId);

            return Map.of("success", true, "transferId", transferId, "message", "Transfer updated successfully");
        } catch (Exception e) {
            throw new RuntimeException("Error updating transfer: " + e.getMessage());
        }
    }
}