package ca.mohawkCollege.WiselySplitServer.controller;

import ca.mohawkCollege.WiselySplitServer.service.TransferService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/transfer")
public class TransferController {

    @Autowired
    private TransferService transferService;
    @Autowired
    private AuthenticationManager authManager;

    /**  CREATE Transfer */
    @PostMapping
    public ResponseEntity<?> createTransfer(@RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> result = transferService.createTransfer(payload);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }


    /** GET Transfer details */
    @GetMapping("/{transferId}")
    public ResponseEntity<?> getTransfer(@PathVariable int transferId) {
        try {
            return ResponseEntity.ok(transferService.getTransferDetails(transferId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**  DELETE Transfer */
    @DeleteMapping("/{transferId}")
    public ResponseEntity<?> deleteTransfer(@PathVariable int transferId) {
        try {
            transferService.deleteTransfer(transferId);
            return ResponseEntity.ok(Map.of("message", "Transfer deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /* UPDATE Transfer */
    @PutMapping("/{transferId}")
    public ResponseEntity<?> updateTransfer(@PathVariable int transferId, @RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> result = transferService.updateTransfer(transferId, payload);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}