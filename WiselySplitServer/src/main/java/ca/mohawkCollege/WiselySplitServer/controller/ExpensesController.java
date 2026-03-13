package ca.mohawkCollege.WiselySplitServer.controller;

import ca.mohawkCollege.WiselySplitServer.service.ExpensesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
public class ExpensesController {

    @Autowired
    private ExpensesService expensesService;
    @Autowired
    private AuthenticationManager authManager;

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

    /**  CREATE Personal Expense for Automation */
    @PostMapping("/personal/Automation")
    public ResponseEntity<?> createPersonalExpenseWithAutomation(@RequestBody Map<String, Object> payload) {
        try {
            String email = (String) payload.get("userEmail");
            String password = (String) payload.get("Password");

            if (email == null || password == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Email and password are required"));
            }

            try {
                Authentication auth = authManager.authenticate(
                        new UsernamePasswordAuthenticationToken(email, password));
                UserDetails principal = (UserDetails) auth.getPrincipal();

                Map<String, Object> result = expensesService.createPersonalExpenseWithAutomation(payload, email);
                return ResponseEntity.ok(result);

            } catch (BadCredentialsException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid credentials"));
            }
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