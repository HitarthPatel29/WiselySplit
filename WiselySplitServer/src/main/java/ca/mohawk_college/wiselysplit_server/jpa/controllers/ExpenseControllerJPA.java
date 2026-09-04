package ca.mohawk_college.wiselysplit_server.jpa.controllers;

import ca.mohawk_college.wiselysplit_server.exceptions.BusinessException;
import ca.mohawk_college.wiselysplit_server.jpa.constants.AppConstants;
import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.ResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.PersonalSummaryResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.expense.*;
import ca.mohawk_college.wiselysplit_server.jpa.services.ExpenseServiceJPA;
import ca.mohawk_college.wiselysplit_server.models.dtos.PersonalExpenseImportDTO;
import ca.mohawk_college.wiselysplit_server.utilities.auth.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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

    /** GET Expense details — resource-scoped: id says *what*, JWT says *who*. */
    @PreAuthorize("@authz.canAccessExpense(#expenseId)")
    @GetMapping("/{expenseId}")
    public ResponseEntity<ResponseDTO> getExpense(@PathVariable long expenseId) {
        return ResponseDTO.respond(StatusCode.SUCCESS, expenseService.getExpenseDetails(expenseId));
    }

//    @GetMapping("me/group-by-wallets/")
//    public ResponseEntity<ResponseDTO> getExpensesGroupedByWallets(@AuthenticationPrincipal AuthenticatedUser me) {
//        return ResponseDTO.respond(StatusCode.SUCCESS, expenseService.getExpensesGroupedByWallet(me.getUserId()));
//    }

    /**
     * PERSONAL SUMMARY — self-scoped: caller identity comes from the JWT principal,
     * so there is no userId in the request to spoof.
     * GET /api/jpa/expenses/me/summary?startDate=&endDate=
     */
    @GetMapping("/me/summary")
    public ResponseEntity<ResponseDTO> getPersonalSummary(
            @AuthenticationPrincipal AuthenticatedUser me,
            @RequestParam("startDate") LocalDate startDate,
            @RequestParam("endDate") LocalDate endDate) {

        if (me == null) {
            throw new AccessDeniedException("Not authenticated");
        }
        PersonalSummaryResponseDTO data = expenseService.getPersonalSummary(me.getUserId(), startDate, endDate);
        return ResponseDTO.respond(StatusCode.SUCCESS, data);
    }

    /**  DELETE Expense */
    @PreAuthorize("@authz.canAccessExpense(#expenseId)")
    @DeleteMapping("/{expenseId}")
    public ResponseEntity<ResponseDTO> deleteExpense(@PathVariable long expenseId) {
        expenseService.deleteExpense(expenseId);
        return ResponseDTO.respond(StatusCode.DELETED, Map.of("expenseId", expenseId));
    }

    /* UPDATE Expense */
    @PreAuthorize("@authz.canAccessExpense(#expenseUpdateDTO.expenseId())")
    @PutMapping()
    public ResponseEntity<ResponseDTO> updateExpense(@Valid @RequestBody ExpenseUpdateRequestDTO expenseUpdateDTO) {
        ExpenseResponseDTO updateResponseDTO = expenseService.updateExpense(expenseUpdateDTO);
        return ResponseDTO.respond(StatusCode.UPDATED, updateResponseDTO);
    }
}
