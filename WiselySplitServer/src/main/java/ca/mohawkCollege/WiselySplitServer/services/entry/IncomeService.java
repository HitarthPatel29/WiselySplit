package ca.mohawkCollege.wiselySplitServer.services.entry;

import ca.mohawkCollege.wiselySplitServer.daos.ExpensesDAO;
import ca.mohawkCollege.wiselySplitServer.daos.WalletDAO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
@Service
public class IncomeService {

    @Autowired
    private ExpensesDAO expensesDAO;

    @Autowired
    private WalletDAO walletDAO;

    @Transactional
    public Map<String, Object> createIncome(Map<String, Object> payload) {
        try {
            String title = (String) payload.get("title");
            String date = (String) payload.get("date");
            String type = (String) payload.get("category");
            double amount = ((Number) payload.get("amount")).doubleValue();
            int userId = ((Number) payload.get("userId")).intValue();
            Integer walletId = payload.get("walletId") != null ? ((Number) payload.get("walletId")).intValue() : null;

            int incomeId = expensesDAO.insertPersonalExpense(title, date, type, amount, userId, walletId, "income", null);

            //Update wallet Balance
            if (null != walletId) walletDAO.updateWalletBalance(userId, walletId, amount, WalletDAO.WalletBalanceUpdateMode.INCOME);

            return Map.of("success", true, "incomeId", incomeId, "message", "Personal entry created successfully");
        } catch (Exception e) {
            throw new RuntimeException("Error creating personal income: " + e.getMessage());
        }
    }


    /**  Fetch single income details */
    public Map<String, Object> getIncomeDetails(int incomeId) {
        return expensesDAO.findExpenseById(incomeId);
    }

    /**  Delete income */
    public void deleteIncome(int incomeId) {
        walletDAO.updateWalletBalanceForEntryDelete(incomeId, WalletDAO.WalletBalanceUpdateMode.INCOME);
        expensesDAO.deleteExpense(incomeId);
    }

    @Transactional
    public Map<String, Object> updateIncome(int incomeId, Map<String, Object> payload) {
        try {
            String title = (String) payload.get("title");
            String date = (String) payload.get("date");
            String type = (String) payload.get("category");
            double amount = ((Number) payload.get("amount")).doubleValue();
            int userId = ((Number) payload.get("userId")).intValue();

            Integer walletId = payload.get("walletId") != null ? ((Number) payload.get("walletId")).intValue() : null;

            //Deducts old income amount and Adds new income amount
            if (null != walletId) walletDAO.updateWalletBalanceForEntryUpdate(userId, walletId, incomeId, amount, WalletDAO.WalletBalanceUpdateMode.INCOME);

            expensesDAO.updateExpense(incomeId, title, date, type, amount, userId, null, true, walletId, "income", null);

            return Map.of("success", true, "incomeId", incomeId, "message", "Income updated successfully");
        } catch (Exception e) {
            throw new RuntimeException("Error updating income: " + e.getMessage());
        }
    }
}