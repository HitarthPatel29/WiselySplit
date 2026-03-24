package ca.mohawkCollege.WiselySplitServer.service;

import ca.mohawkCollege.WiselySplitServer.dao.ExpensesDAO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
@Service
public class IncomeService {

    @Autowired
    private ExpensesDAO expensesDAO;

    @Transactional
    public Map<String, Object> createIncome(Map<String, Object> payload) {
        try {
            String title = (String) payload.get("title");
            String date = (String) payload.get("date");
            String type = (String) payload.get("type");
            double amount = ((Number) payload.get("amount")).doubleValue();
            int userId = ((Number) payload.get("userId")).intValue();
            Integer walletId = payload.get("walletId") != null ? ((Number) payload.get("walletId")).intValue() : null;

            int incomeId = expensesDAO.insertPersonalExpense(title, date, type, amount, userId, walletId, "income", null);

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
        expensesDAO.deleteExpense(incomeId);
    }

    @Transactional
    public Map<String, Object> updateIncome(int incomeId, Map<String, Object> payload) {
        try {
            String title = (String) payload.get("title");
            String date = (String) payload.get("date");
            String type = (String) payload.get("type");
            double amount = ((Number) payload.get("amount")).doubleValue();
            int payerId = ((Number) payload.get("userId")).intValue();

            Integer walletId = payload.get("walletId") != null ? ((Number) payload.get("walletId")).intValue() : null;

            expensesDAO.updateExpense(incomeId, title, date, type, amount, payerId, null, true, walletId, "income", null);

            return Map.of("success", true, "incomeId", incomeId, "message", "Income updated successfully");
        } catch (Exception e) {
            throw new RuntimeException("Error updating income: " + e.getMessage());
        }
    }
}