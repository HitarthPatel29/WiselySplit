package ca.mohawkCollege.WiselySplitServer.service;

import ca.mohawkCollege.WiselySplitServer.dao.ExpensesDAO;
import ca.mohawkCollege.WiselySplitServer.dao.PaymentDAO;
import ca.mohawkCollege.WiselySplitServer.dao.UserDAO;
import ca.mohawkCollege.WiselySplitServer.dao.WalletDAO;
import ca.mohawkCollege.WiselySplitServer.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ExpensesService {

    @Autowired
    private ExpensesDAO expensesDAO;
    @Autowired
    private WalletDAO walletDAO;
    @Autowired
    private UserDAO userDAO;
    @Autowired
    private PaymentDAO paymentDAO;


    /** Create expense for friend or group */
    @Transactional
    public Map<String, Object> createSharedExpense(Map<String, Object> payload) {
        try {
            String title = (String) payload.get("title");
            String date = (String) payload.get("date");
            String type = (String) payload.get("type");
            double amount = ((Number) payload.get("amount")).doubleValue();
            int payerId = ((Number) payload.get("payerId")).intValue();

            String shareWithType = (String) payload.get("shareWithType");
            Integer groupId = ("group".equalsIgnoreCase(shareWithType) && payload.get("shareWithId") != null) ? ((Number) payload.get("shareWithId")).intValue() : null;

            boolean isSettleUp = Boolean.TRUE.equals(payload.get("isSettleUp"));
            Integer paymentId = payload.get("paymentId") != null ? ((Number) payload.get("paymentId")).intValue() : null;
            Integer walletId = payload.get("walletId") != null ? ((Number) payload.get("walletId")).intValue() : null;

            // Insert into Expenses table
            int expenseId = expensesDAO.insertSharedExpense(title, date, type, amount, payerId, groupId, isSettleUp, paymentId, walletId);

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

            return Map.of("success", true, "expenseId", expenseId, "message", "Shared Expense created successfully");
        } catch (Exception e) {
            throw new RuntimeException("Error creating shared expense: " + e.getMessage());
        }
    }
    @Transactional
    public Map<String, Object> createPersonalExpense(Map<String, Object> payload) {
        try {
            String title = (String) payload.get("title");
            String date = (String) payload.get("date");
            String type = (String) payload.get("type");
            double amount = ((Number) payload.get("amount")).doubleValue();
            int userId = ((Number) payload.get("userId")).intValue();
            Integer walletId = payload.get("walletId") != null ? ((Number) payload.get("walletId")).intValue() : null;
            String entryKind = payload.get("entryKind") != null ? (String) payload.get("entryKind") : "expense";
            Integer toWalletId = payload.get("toWalletId") != null ? ((Number) payload.get("toWalletId")).intValue() : null;

            int expenseId = expensesDAO.insertPersonalExpense(title, date, type, amount, userId, walletId, entryKind, toWalletId);

            return Map.of("success", true, "expenseId", expenseId, "message", "Personal entry created successfully");
        } catch (Exception e) {
            throw new RuntimeException("Error creating personal expense: " + e.getMessage());
        }
    }
    @Transactional
    public Map<String, Object> createPersonalExpenseWithAutomation(Map<String, Object> payload, String userEmail) {
        try {
            String title = (String) payload.get("transactionTitle");
            String date = (String) payload.get("transactionDate");
            String type = (String) payload.get("name");
            String walletName = (String) payload.get("cardName");
            double amount = ((Number) payload.get("amount")).doubleValue();

            Optional<User> user = userDAO.findByEmail(userEmail);
            int userId = user.get().getUserId();

            int walletId = ((Number) walletDAO.getWalletId(walletName, userId).get("walletId")).intValue();

            int expenseId = expensesDAO.insertPersonalExpense(title, date, type, amount, userId, walletId, "expense", null);

            return Map.of("success", true, "expenseId", expenseId, "message", "Personal Expense created successfully");
        } catch (Exception e) {
            throw new RuntimeException("Error creating personal expense: " + e.getMessage());
        }
    }

    /** Create a payment record (used by Stripe flow)
     * TODO: Add payerWalletId and receiverWalletId
     * */

    public Map<String, Object> createPayment(Map<String, Object> payload) {
        try {
            double amount = ((Number) payload.get("amount")).doubleValue();
            Integer payerId = ((Number) payload.get("payerId")).intValue();
            Integer receiverId = ((Number) payload.get("receiverId")).intValue();

            // Use PaymentDAO instead of ExpensesDAO to properly handle Stripe fields
            Integer paymentId = paymentDAO.addPayment(
                amount, 
                payerId, 
                receiverId, 
                null,  // stripePaymentIntentId - will be set later
                null,  // stripeTransferId - will be set later
                "PENDING"  // status
            );

            return Map.of(
                    "success", true,
                    "paymentId", paymentId,
                    "message", "Payment record created successfully"
            );
        } catch (Exception e) {
            throw new RuntimeException("Error creating payment: " + e.getMessage());
        }
    }

    public Map<String, Object> getPersonalSummary(int userId, String startDate, String endDate) {

        List<Map<String, Object>> rows =
                expensesDAO.fetchPersonalSummary(userId, startDate, endDate);

        double totalLent = 0;
        double totalOwed = 0;

        for (Map<String, Object> r : rows) {
            double net = ((Number) r.get("netAmount")).doubleValue();
            if (net < 0) totalLent += Math.abs(net);
            else if (net > 0) totalOwed += net;
        }

        return Map.of(
                "summary", Map.of(
                        "totalLent", totalLent,
                        "totalOwed", totalOwed
                ),
                "expenses", rows
        );
    }

    /**  Fetch single expense details */
    public Map<String, Object> getExpenseDetails(int expenseId) {
        Map<String, Object> expense = expensesDAO.findExpenseById(expenseId);
        if ( ! ((boolean) expense.get("isPersonal")) ) {
            List<Map<String, Object>> participants = expensesDAO.findExpenseParticipants(expenseId);
            expense.put("splitDetails", participants);
        }
        return expense;
    }

    /** Fetch Shared + Personal Expenses (Grouped by Wallet) */
    public List<Map<String, Object>> getExpensesGroupedByWallet(int userId){
        List<Map<String, Object>> wallets = walletDAO.getWallets(userId);
        for (Map<String, Object> wallet : wallets){
            wallet.put("expenses", expensesDAO.getExpenseForWallet(userId, ((Number) wallet.get("walletId")).intValue() ));
        }
        return wallets;
    }

    /**  Delete expense */
    public void deleteExpense(int expenseId) {
        expensesDAO.deleteExpense(expenseId);
    }

    @Transactional
    public Map<String, Object> updateExpense(int expenseId, Map<String, Object> payload) {
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

            Boolean isPersonal = ((Boolean) payload.get("isPersonal")).booleanValue();
            Integer walletId = payload.get("walletId") != null ? ((Number) payload.get("walletId")).intValue() : null;
            String entryKind = payload.get("entryKind") != null ? (String) payload.get("entryKind") : "expense";
            Integer toWalletId = payload.get("toWalletId") != null ? ((Number) payload.get("toWalletId")).intValue() : null;

            expensesDAO.updateExpense(expenseId, title, date, type, amount, payerId, groupId, isPersonal, walletId, entryKind, toWalletId);

            if (!isPersonal) {
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
            }
            return Map.of("success", true, "expenseId", expenseId, "message", "Expense updated successfully");
        } catch (Exception e) {
            throw new RuntimeException("Error updating expense: " + e.getMessage());
        }
    }
}