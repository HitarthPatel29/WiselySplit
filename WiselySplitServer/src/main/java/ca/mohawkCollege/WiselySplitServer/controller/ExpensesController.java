package ca.mohawkCollege.WiselySplitServer.controller;

import ca.mohawkCollege.WiselySplitServer.service.ExpensesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
public class ExpensesController {

    @Autowired
    private ExpensesService expensesService;

    /**  CREATE Shared Expense (Friend or group) */
    @PostMapping("/shared")
    public ResponseEntity<?> createSharedExpense(@RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> result = expensesService.createSharedExpense(payload);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**  CREATE Personal Expense */
    @PostMapping("/personal")
    public ResponseEntity<?> createPersonalExpense(@RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> result = expensesService.createPersonalExpense(payload);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /** CREATE Payment (returns PaymentID) */
    @PostMapping("/payments")
    public ResponseEntity<?> createPayment(@RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> result = expensesService.createPayment(payload);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /** GET Expense details */
    @GetMapping("/{expenseId}")
    public ResponseEntity<?> getExpense(@PathVariable int expenseId) {
        try {
            return ResponseEntity.ok(expensesService.getExpenseDetails(expenseId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/group-by-wallets/{userId}")
    public ResponseEntity<?> getExpensesGroupedByWallets(@PathVariable int userId) {
        try {
            return ResponseEntity.ok(expensesService.getExpensesGroupedByWallet(userId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /** PERSONAL SUMMARY for given date-range (default 1 month) */
    @GetMapping("/{userId}/personal-summary")
    public ResponseEntity<?> getPersonalSummary(
            @PathVariable int userId,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate) {

        try {
            Map<String, Object> data =
                    expensesService.getPersonalSummary(userId, startDate, endDate);

            return ResponseEntity.ok(data);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**  DELETE Expense */
    @DeleteMapping("/{expenseId}")
    public ResponseEntity<?> deleteExpense(@PathVariable int expenseId) {
        try {
            expensesService.deleteExpense(expenseId);
            return ResponseEntity.ok(Map.of("message", "Expense deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /* UPDATE Expense */
    @PutMapping("/{expenseId}")
    public ResponseEntity<?> updateExpense(@PathVariable int expenseId, @RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> result = expensesService.updateExpense(expenseId, payload);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}