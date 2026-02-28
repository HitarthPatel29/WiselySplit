package ca.mohawkCollege.WiselySplitServer.controller;

import ca.mohawkCollege.WiselySplitServer.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users/{userId}/wallets")
public class WalletController {
    @Autowired
    private WalletService walletService;

    /* Get all Wallets */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getWallets(@PathVariable int userId) {
        List<Map<String, Object>> wallets = walletService.getWallets(userId);
        return ResponseEntity.ok(wallets);
    }

    @PostMapping
    public ResponseEntity<?> createWallet(@PathVariable int userId, @RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> result = walletService.createWallet(userId, payload);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{walletId}")
    public ResponseEntity<?> updateExpense(@PathVariable int userId, @PathVariable int walletId, @RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> result = walletService.updateWallet(userId, walletId, payload);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{walletId}")
    public ResponseEntity<Void> deleteWallet( @PathVariable int userId, @PathVariable int walletId) {
        walletService.deleteWallet(userId, walletId);
        return ResponseEntity.noContent().build();
    }
}
