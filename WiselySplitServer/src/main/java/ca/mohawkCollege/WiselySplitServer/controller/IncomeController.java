package ca.mohawkCollege.WiselySplitServer.controller;

import ca.mohawkCollege.WiselySplitServer.service.IncomeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/income")
public class IncomeController {

    @Autowired
    private IncomeService incomeService;
    @Autowired
    private AuthenticationManager authManager;

    /**  CREATE Income */
    @PostMapping
    public ResponseEntity<?> createIncome(@RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> result = incomeService.createIncome(payload);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }


    /** GET Income details */
    @GetMapping("/{incomeId}")
    public ResponseEntity<?> getIncome(@PathVariable int incomeId) {
        try {
            return ResponseEntity.ok(incomeService.getIncomeDetails(incomeId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**  DELETE Income */
    @DeleteMapping("/{incomeId}")
    public ResponseEntity<?> deleteIncome(@PathVariable int incomeId) {
        try {
            incomeService.deleteIncome(incomeId);
            return ResponseEntity.ok(Map.of("message", "Income deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /* UPDATE Income */
    @PutMapping("/{incomeId}")
    public ResponseEntity<?> updateIncome(@PathVariable int incomeId, @RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> result = incomeService.updateIncome(incomeId, payload);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}