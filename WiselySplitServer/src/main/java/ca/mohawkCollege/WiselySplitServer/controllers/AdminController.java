package ca.mohawkCollege.wiselySplitServer.controllers;

import ca.mohawkCollege.wiselySplitServer.daos.UserDAO;
import ca.mohawkCollege.wiselySplitServer.models.User;
import ca.mohawkCollege.wiselySplitServer.models.dto.AdminUserView;
import ca.mohawkCollege.wiselySplitServer.services.AdminService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * Admin-only account management API.
 *
 * Authorization is enforced at two layers: the SecurityConfig request matcher
 * (/api/admin/** -> hasRole ADMIN) and the class-level @PreAuthorize below.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final UserDAO userDAO;

    public AdminController(AdminService adminService, UserDAO userDAO) {
        this.adminService = adminService;
        this.userDAO = userDAO;
    }

    /** List accounts with their roles. Supports role filter, search, pagination. */
    @GetMapping("/accounts")
    public ResponseEntity<?> listAccounts(
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.listAccounts(role, search, page, size));
    }

    @GetMapping("/accounts/{id}")
    public ResponseEntity<AdminUserView> getAccount(@PathVariable int id) {
        return ResponseEntity.ok(adminService.getAccount(id));
    }

    @PostMapping("/accounts")
    public ResponseEntity<AdminUserView> createAccount(@RequestBody Map<String, Object> payload,
                                                       Authentication auth) {
        User actor = currentUser(auth);
        AdminUserView created = adminService.createAccount(payload, actorId(actor), actorEmail(actor));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/accounts/{id}")
    public ResponseEntity<AdminUserView> updateAccount(@PathVariable int id,
                                                       @RequestBody Map<String, Object> payload,
                                                       Authentication auth) {
        User actor = currentUser(auth);
        return ResponseEntity.ok(adminService.updateAccount(id, payload, actorId(actor), actorEmail(actor)));
    }

    @DeleteMapping("/accounts/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable int id, Authentication auth) {
        User actor = currentUser(auth);
        adminService.deleteAccount(id, actorId(actor), actorEmail(actor));
        return ResponseEntity.noContent().build();
    }

    /** Set an account's role (e.g. promote a user to TEST_PROFILE or ADMIN). */
    @PatchMapping("/accounts/{id}/role")
    public ResponseEntity<AdminUserView> changeRole(@PathVariable int id,
                                                    @RequestBody Map<String, String> body,
                                                    Authentication auth) {
        User actor = currentUser(auth);
        return ResponseEntity.ok(adminService.changeRole(id, body.get("role"), actorId(actor), actorEmail(actor)));
    }

    @PostMapping("/accounts/{id}/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@PathVariable int id,
                                                             @RequestBody Map<String, String> body,
                                                             Authentication auth) {
        User actor = currentUser(auth);
        adminService.resetPassword(id, body.get("newPassword"), actorId(actor), actorEmail(actor));
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        return ResponseEntity.ok(adminService.stats());
    }

    @GetMapping("/audit")
    public ResponseEntity<?> audit(@RequestParam(value = "limit", defaultValue = "25") int limit,
                                   @RequestParam(value = "offset", defaultValue = "0") int offset) {
        return ResponseEntity.ok(adminService.audit(limit, offset));
    }

    // ----------------------------------------------------- actor resolution

    private User currentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;
        Optional<User> opt = userDAO.findByEmail(auth.getName());
        return opt.orElse(null);
    }

    private Integer actorId(User actor) {
        return actor == null ? null : actor.getUserId();
    }

    private String actorEmail(User actor) {
        return actor == null ? null : actor.getEmail();
    }
}
