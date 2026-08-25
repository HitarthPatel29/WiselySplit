package ca.mohawkCollege.wiselySplitServer.jpa.controllers;

import ca.mohawkCollege.wiselySplitServer.exceptions.BusinessException;
import ca.mohawkCollege.wiselySplitServer.jpa.constants.AppConstants;
import ca.mohawkCollege.wiselySplitServer.jpa.constants.StatusCode;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.ResponseDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.expense.PersonalExpenseAutomationRequestDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.expense.PersonalExpenseRequestDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.expense.SharedExpenseRequestDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.services.ExpenseServiceJPA;
import ca.mohawkCollege.wiselySplitServer.models.dtos.PersonalExpenseImportDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jpa/expenses")
public class ExpenseControllerJPA {

    @Autowired private ExpenseServiceJPA expenseService;
    @Autowired private AuthenticationManager authManager;

    /**  CREATE Shared Expense (Friend or group) */
    @PostMapping("/shared")
    public ResponseEntity<ResponseDTO> createSharedExpense(@Valid @RequestBody SharedExpenseRequestDTO expenseRequestDTO) {
        Long expenseId = expenseService.createSharedExpense(expenseRequestDTO);
        return ResponseDTO.respond(StatusCode.CREATED, expenseId);
    }

    /**  CREATE Personal Expense */
    @PostMapping("/personal")
    public ResponseEntity<ResponseDTO> createPersonalExpense(@Valid @RequestBody PersonalExpenseRequestDTO expenseRequestDTO) {
        Long expenseId = expenseService.createPersonalExpense(expenseRequestDTO);
        return ResponseDTO.respond(StatusCode.CREATED, expenseId);
    }

    /**  BATCH CREATE Personal Expenses (CSV import) */
    @PostMapping("/personal/batch")
    public ResponseEntity<ResponseDTO> createPersonalExpensesBatch(@RequestBody List<PersonalExpenseImportDTO> rows) {
        if (rows == null || rows.isEmpty()) {
            throw new BusinessException(StatusCode.EMPTY_BATCH, "CSV import submitted with no rows");
        }
        if (rows.size() > AppConstants.MAX_ROWS_IN_CSV_BATCH) {
            throw new BusinessException(StatusCode.BATCH_SIZE_EXCEEDED,
                    "CSV import of " + rows.size() + " rows exceeds the limit of " + AppConstants.MAX_ROWS_IN_CSV_BATCH)
                    .withDetails(Map.of("maxRows", AppConstants.MAX_ROWS_IN_CSV_BATCH, "submittedRows", rows.size()));
        }

        Map<String, Object> result = expenseService.createPersonalExpensesBatch(rows);
        return ResponseDTO.respond(StatusCode.CREATED, result);
    }

    /**  CREATE Personal Expense for Automation */
    @PostMapping("/personal/automation")
    public ResponseEntity<ResponseDTO> createPersonalExpenseWithAutomation(@Valid @RequestBody PersonalExpenseAutomationRequestDTO expenseAutomationRequestDTO) {
        String email = expenseAutomationRequestDTO.userEmail();
        String password = expenseAutomationRequestDTO.password();

        if (email == null || password == null) {
            throw new BusinessException(StatusCode.MISSING_REQUIRED_FIELD,
                    "Automation request missing userEmail or password");
        }

        // throws BadCredentialsException, which the global handler renders as INVALID_CREDENTIALS
        authManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));

        Long expenseId = expenseService.createPersonalExpenseWithAutomation(expenseAutomationRequestDTO);
        return ResponseDTO.respond(StatusCode.CREATED, expenseId);
    }

    /** CREATE Payment (returns PaymentID) */
    @PostMapping("/payments")
    public ResponseEntity<ResponseDTO> createPayment(@RequestBody Map<String, Object> payload) {
        Map<String, Object> result = expenseService.createPayment(payload);
        return ResponseDTO.respond(StatusCode.CREATED, result);
    }

    /** GET Expense details */
    @GetMapping("/{expenseId}")
    public ResponseEntity<ResponseDTO> getExpense(@PathVariable long expenseId) {
        return ResponseDTO.respond(StatusCode.SUCCESS, expenseService.getExpenseDetails(expenseId));
    }

    @GetMapping("/group-by-wallets/{userId}")
    public ResponseEntity<ResponseDTO> getExpensesGroupedByWallets(@PathVariable long userId) {
        return ResponseDTO.respond(StatusCode.SUCCESS, expenseService.getExpensesGroupedByWallet(userId));
    }

    /** PERSONAL SUMMARY for given date-range (default 1 month) */
    @GetMapping("/{userId}/personal-summary")
    public ResponseEntity<ResponseDTO> getPersonalSummary(
            @PathVariable long userId,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate) {

        Map<String, Object> data = expenseService.getPersonalSummary(userId, startDate, endDate);
        return ResponseDTO.respond(StatusCode.SUCCESS, data);
    }

    /**  DELETE Expense */
    @DeleteMapping("/{expenseId}")
    public ResponseEntity<ResponseDTO> deleteExpense(@PathVariable long expenseId) {
        expenseService.deleteExpense(expenseId);
        return ResponseDTO.respond(StatusCode.DELETED, Map.of("expenseId", expenseId));
    }

    /* UPDATE Expense */
    @PutMapping("/{expenseId}")
    public ResponseEntity<ResponseDTO> updateExpense(@PathVariable long expenseId, @RequestBody Map<String, Object> payload) {
        Map<String, Object> result = expenseService.updateExpense(expenseId, payload);
        return ResponseDTO.respond(StatusCode.UPDATED, result);
    }
}
