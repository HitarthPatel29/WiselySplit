package ca.mohawkCollege.WiselySplitServer.service;

import ca.mohawkCollege.WiselySplitServer.dao.ExpensesDAO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
public class ExpensesService {

    @Autowired
    private ExpensesDAO expensesDAO;

    /** Create expense for friend or group */
    @Transactional
    public Map<String, Object> createExpense(Map<String, Object> payload) {
        try {
            String title = (String) payload.get("title");
            String date = (String) payload.get("date");
            String type = (String) payload.get("type");
            double amount = ((Number) payload.get("amount")).doubleValue();
            int payerId = ((Number) payload.get("payerId")).intValue();
            String shareWithType = (String) payload.get("shareWithType");

            Integer groupId = null;
            if ("group".equalsIgnoreCase(shareWithType) && payload.get("shareWithId") != null) {
                groupId = ((Number) payload.get("shareWithId")).intValue();
            }

            // Insert into Expenses table
            int expenseId = expensesDAO.insertExpense(title, date, type, amount, payerId, groupId);

            // Insert participants
            List<Map<String, Object>> participants = (List<Map<String, Object>>) payload.get("splitDetails");
            for (Map<String, Object> m : participants) {
                int userId = ((Number) m.get("userId")).intValue();
                double contribution = ((Number) m.get("amount")).doubleValue();
                double contributionPortion = ((Number) m.get("portion")).doubleValue();
                if (contribution > 0) {
                    expensesDAO.insertExpenseParticipation(expenseId, userId, contribution, contributionPortion);
                }
            }

            return Map.of("success", true, "expenseId", expenseId, "message", "Expense created successfully");
        } catch (Exception e) {
            throw new RuntimeException("Error creating expense: " + e.getMessage());
        }
    }

    /**  Fetch single expense details */
    public Map<String, Object> getExpenseDetails(int expenseId) {
        Map<String, Object> expense = expensesDAO.findExpenseById(expenseId);
        List<Map<String, Object>> participants = expensesDAO.findExpenseParticipants(expenseId);
        expense.put("splitDetails", participants);
        return expense;
    }

    /**  Delete expense */
    public void deleteExpense(int expenseId) {
        expensesDAO.deleteExpense(expenseId);
    }

    @Transactional
    public Map<String, Object> updateExpense(int expenseId, Map<String, Object> payload) {
        try {
            // Parse data
            String title = (String) payload.get("title");
            String date = (String) payload.get("date");
            String type = (String) payload.get("type");
            double amount = ((Number) payload.get("amount")).doubleValue();
            int payerId = ((Number) payload.get("payerId")).intValue();
            String shareWithType = (String) payload.get("shareWithType");

            Integer groupId = null;
            if ("group".equalsIgnoreCase(shareWithType) && payload.get("shareWithId") != null) {
                groupId = ((Number) payload.get("shareWithId")).intValue();
            }

            // Update Expense
            expensesDAO.updateExpense(expenseId, title, date, type, amount, payerId, groupId);

            // Delete old participation and insert new ones
            expensesDAO.deleteExpenseParticipation(expenseId);
            List<Map<String, Object>> participants = (List<Map<String, Object>>) payload.get("splitDetails");
            for (Map<String, Object> m : participants) {
                int userId = ((Number) m.get("userId")).intValue();
                double contribution = ((Number) m.get("amount")).doubleValue();
                double contributionPortion = ((Number) m.get("portion")).doubleValue();
                if (contribution > 0) {
                    expensesDAO.insertExpenseParticipation(expenseId, userId, contribution, contributionPortion);
                }
            }

            return Map.of("success", true, "expenseId", expenseId, "message", "Expense updated successfully");
        } catch (Exception e) {
            throw new RuntimeException("Error updating expense: " + e.getMessage());
        }
    }
}