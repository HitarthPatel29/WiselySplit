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

    /**  CREATE Expense (individual or group) */
    @PostMapping
    public ResponseEntity<?> createExpense(@RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> result = expensesService.createExpense(payload);
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