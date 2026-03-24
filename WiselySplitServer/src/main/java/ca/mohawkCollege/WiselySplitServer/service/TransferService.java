package ca.mohawkCollege.WiselySplitServer.service;

import ca.mohawkCollege.WiselySplitServer.dao.ExpensesDAO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
@Service
public class TransferService {

    @Autowired
    private ExpensesDAO expensesDAO;

    @Transactional
    public Map<String, Object> createTransfer(Map<String, Object> payload) {
        try {
            String title = (String) payload.get("title");
            String date = (String) payload.get("date");
            String type = (String) payload.get("type");
            double amount = ((Number) payload.get("amount")).doubleValue();
            int userId = ((Number) payload.get("userId")).intValue();
            Integer walletId = payload.get("walletId") != null ? ((Number) payload.get("walletId")).intValue() : null;
            Integer toWalletId = payload.get("toWalletId") != null ? ((Number) payload.get("toWalletId")).intValue() : null;

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
        expensesDAO.deleteExpense(transferId);
    }

    @Transactional
    public Map<String, Object> updateTransfer(int transferId, Map<String, Object> payload) {
        try {
            String title = (String) payload.get("title");
            String date = (String) payload.get("date");
            String type = (String) payload.get("type");
            double amount = ((Number) payload.get("amount")).doubleValue();
            int payerId = ((Number) payload.get("userId")).intValue();

            Integer walletId = payload.get("walletId") != null ? ((Number) payload.get("walletId")).intValue() : null;
            Integer toWalletId = payload.get("toWalletId") != null ? ((Number) payload.get("toWalletId")).intValue() : null;

            expensesDAO.updateExpense(transferId, title, date, type, amount, payerId, null, true, walletId, "transfer", toWalletId);

            return Map.of("success", true, "transferId", transferId, "message", "Transfer updated successfully");
        } catch (Exception e) {
            throw new RuntimeException("Error updating transfer: " + e.getMessage());
        }
    }
}