package ca.mohawkCollege.wiselySplitServer.services.entry;

import ca.mohawkCollege.wiselySplitServer.daos.ExpensesDAO;
import ca.mohawkCollege.wiselySplitServer.daos.WalletDAO;
import ca.mohawkCollege.wiselySplitServer.models.IncomeImportDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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


    /**
     * Batch-create incomes from a CSV import. Categories are left empty.
     * Inserts use INSERT IGNORE so duplicates (per the Expenses unique
     * constraint) are skipped. The wallet balance is updated once per wallet
     * using the sum of the inserted rows.
     *
     * @return { inserted: <count>, skipped: [ {title, date, amount}, ... ] }
     */
    @Transactional
    public Map<String, Object> createIncomesBatch(List<IncomeImportDTO> rows) {
        if (rows == null || rows.isEmpty()) {
            return Map.of("inserted", 0, "skipped", new ArrayList<>());
        }

        int[] counts = expensesDAO.batchInsertIncomes(rows);

        int inserted = 0;
        List<Map<String, Object>> skipped = new ArrayList<>();
        Map<Integer, Double> walletSums = new HashMap<>();
        Map<Integer, Integer> walletUser = new HashMap<>();

        for (int i = 0; i < rows.size(); i++) {
            IncomeImportDTO r = rows.get(i);
            boolean wasInserted = i < counts.length && counts[i] != 0; // 1 = inserted, 0 = duplicate
            if (wasInserted) {
                inserted++;
                if (r.getWalletId() != null) {
                    walletSums.merge(r.getWalletId(), r.getAmount(), Double::sum);
                    walletUser.put(r.getWalletId(), r.getUserId());
                }
            } else {
                Map<String, Object> s = new HashMap<>();
                s.put("title", r.getTitle());
                s.put("date", r.getDate());
                s.put("amount", r.getAmount());
                skipped.add(s);
            }
        }

        for (Map.Entry<Integer, Double> e : walletSums.entrySet()) {
            walletDAO.updateWalletBalance(walletUser.get(e.getKey()), e.getKey(), e.getValue(),
                    WalletDAO.WalletBalanceUpdateMode.INCOME);
        }

        return Map.of("inserted", inserted, "skipped", skipped);
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