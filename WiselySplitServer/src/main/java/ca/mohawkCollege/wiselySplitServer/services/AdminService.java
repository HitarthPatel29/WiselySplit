package ca.mohawkCollege.wiselySplitServer.services;

import ca.mohawkCollege.wiselySplitServer.daos.AdminAuditDAO;
import ca.mohawkCollege.wiselySplitServer.daos.UserDAO;
import ca.mohawkCollege.wiselySplitServer.exceptions.DuplicateUserException;
import ca.mohawkCollege.wiselySplitServer.exceptions.UserNotFoundException;
import ca.mohawkCollege.wiselySplitServer.models.Role;
import ca.mohawkCollege.wiselySplitServer.models.User;
import ca.mohawkCollege.wiselySplitServer.models.dtos.AdminUserView;
import ca.mohawkCollege.wiselySplitServer.services.user.UserService;
import ca.mohawkCollege.wiselySplitServer.utilities.auth.PasswordUtil;
import ca.mohawkCollege.wiselySplitServer.utilities.auth.ValidationUtil;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Business logic for the admin account-management surface.
 * Every method here assumes the caller has already been authorized as ADMIN
 * (enforced by SecurityConfig + @PreAuthorize). The {@code actor*} parameters
 * identify the acting admin for audit logging and self-lockout protection.
 */
@Service
public class AdminService {

    private final UserDAO userDAO;
    private final UserService userService;
    private final AdminAuditDAO auditDAO;

    public AdminService(UserDAO userDAO, UserService userService, AdminAuditDAO auditDAO) {
        this.userDAO = userDAO;
        this.userService = userService;
        this.auditDAO = auditDAO;
    }

    // ---------------------------------------------------------------- read

    /** Paginated, optionally filtered list of accounts with their roles. */
    public Map<String, Object> listAccounts(String roleFilter, String search, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(100, size));

        String normalizedRole = (roleFilter == null || roleFilter.isBlank()) ? null : Role.normalize(roleFilter);
        String needle = (search == null) ? "" : search.trim().toLowerCase();

        List<AdminUserView> all = userDAO.findAll().stream()
                .filter(u -> normalizedRole == null || normalizedRole.equals(Role.normalize(u.getRole())))
                .filter(u -> needle.isEmpty()
                        || contains(u.getName(), needle)
                        || contains(u.getUserName(), needle)
                        || contains(u.getEmail(), needle))
                .map(AdminUserView::from)
                .toList();

        int total = all.size();
        int from = Math.min(safePage * safeSize, total);
        int to = Math.min(from + safeSize, total);
        List<AdminUserView> content = all.subList(from, to);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("content", content);
        body.put("page", safePage);
        body.put("size", safeSize);
        body.put("total", total);
        body.put("totalPages", (int) Math.ceil(total / (double) safeSize));
        return body;
    }

    public AdminUserView getAccount(int id) {
        User user = userDAO.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User with ID " + id + " not found"));
        return AdminUserView.from(user);
    }

    public Map<String, Object> stats() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("total", userDAO.countAll());
        Map<String, Integer> byRole = new LinkedHashMap<>();
        for (Role r : Role.values()) {
            byRole.put(r.name(), userDAO.countByRole(r.name()));
        }
        body.put("byRole", byRole);
        return body;
    }

    public Map<String, Object> audit(int limit, int offset) {
        int safeLimit = Math.max(1, Math.min(200, limit));
        int safeOffset = Math.max(0, offset);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("rows", auditDAO.findRecent(safeLimit, safeOffset));
        body.put("total", auditDAO.countAll());
        body.put("limit", safeLimit);
        body.put("offset", safeOffset);
        return body;
    }

    // -------------------------------------------------------------- mutate

    /** Manual account creation by an admin. Reuses standard validation + hashing. */
    public AdminUserView createAccount(Map<String, Object> payload, Integer actorId, String actorEmail) {
        User user = new User();
        user.setName(asString(payload.get("name")));
        user.setUserName(asString(payload.get("userName")));
        user.setEmail(asString(payload.get("email")));
        user.setPhoneNum(asLong(payload.get("phoneNum")));
        user.setPassword(asString(payload.get("password")));
        user.setProfilePicture(asString(payload.get("profilePicture")));

        String rawRole = payload.get("role") == null ? Role.DEFAULT : asString(payload.get("role"));
        if (rawRole == null || !Role.isValid(rawRole.trim().toUpperCase())) {
            throw new IllegalArgumentException("Invalid role. Must be one of ADMIN, TEST_PROFILE, USER");
        }
        user.setRole(Role.normalize(rawRole));

        // createUser validates email + password strength, enforces uniqueness,
        // hashes the password, applies the default avatar and persists the role.
        User created = userService.createUser(user);

        auditDAO.record(actorId, actorEmail, "CREATE_ACCOUNT", created.getUserId(),
                "Created account " + created.getEmail() + " with role " + created.getRole());
        return AdminUserView.from(created);
    }

    /** Update mutable profile fields, and optionally role/password, of any account. */
    public AdminUserView updateAccount(int id, Map<String, Object> payload, Integer actorId, String actorEmail) {
        User existing = userDAO.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User with ID " + id + " not found"));

        if (payload.containsKey("name")) existing.setName(asString(payload.get("name")));
        if (payload.containsKey("phoneNum")) existing.setPhoneNum(asLong(payload.get("phoneNum")));
        if (payload.containsKey("profilePicture")) existing.setProfilePicture(asString(payload.get("profilePicture")));

        if (payload.containsKey("userName")) {
            String newUserName = asString(payload.get("userName"));
            if (newUserName != null && !newUserName.equalsIgnoreCase(existing.getUserName())) {
                userDAO.findByUsername(newUserName).ifPresent(u -> {
                    throw new DuplicateUserException("Username Not Available, Choose a Unique UserName");
                });
                existing.setUserName(newUserName);
            }
        }

        if (payload.containsKey("email")) {
            String newEmail = asString(payload.get("email"));
            if (newEmail != null && !newEmail.equalsIgnoreCase(existing.getEmail())) {
                if (!ValidationUtil.isValidEmail(newEmail)) {
                    throw new IllegalArgumentException("Invalid email format");
                }
                userDAO.findByEmail(newEmail).ifPresent(u -> {
                    throw new DuplicateUserException("This Email is already attached with an Existing Account");
                });
                existing.setEmail(newEmail);
            }
        }

        try {
            userDAO.update(existing);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateUserException("Username or Email already exists");
        }

        // Optional role change goes through the guarded path.
        if (payload.containsKey("role")) {
            applyRoleChange(existing, asString(payload.get("role")), actorId);
        }

        // Optional password change (hashed; strength enforced).
        if (payload.containsKey("password") && asString(payload.get("password")) != null) {
            String newPassword = asString(payload.get("password"));
            if (!ValidationUtil.isStrongPassword(newPassword)) {
                throw new IllegalArgumentException("Weak password – must include upper, lower, digit, special and be 8+ chars");
            }
            userDAO.updatePassword(id, PasswordUtil.hashPassword(newPassword));
        }

        auditDAO.record(actorId, actorEmail, "UPDATE_ACCOUNT", id, "Updated account fields: " + payload.keySet());

        return AdminUserView.from(userDAO.findById(id).orElseThrow());
    }

    /** Change a single account's role (covers "make any account a TestProfile"). */
    public AdminUserView changeRole(int id, String newRole, Integer actorId, String actorEmail) {
        User target = userDAO.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User with ID " + id + " not found"));

        applyRoleChange(target, newRole, actorId);

        auditDAO.record(actorId, actorEmail, "CHANGE_ROLE", id,
                "Role changed to " + Role.normalize(newRole));
        return AdminUserView.from(userDAO.findById(id).orElseThrow());
    }

    public void resetPassword(int id, String newPassword, Integer actorId, String actorEmail) {
        userDAO.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User with ID " + id + " not found"));
        if (newPassword == null || !ValidationUtil.isStrongPassword(newPassword)) {
            throw new IllegalArgumentException("Weak password – must include upper, lower, digit, special and be 8+ chars");
        }
        userDAO.updatePassword(id, PasswordUtil.hashPassword(newPassword));
        auditDAO.record(actorId, actorEmail, "RESET_PASSWORD", id, "Admin reset password");
    }

    public void deleteAccount(int id, Integer actorId, String actorEmail) {
        User target = userDAO.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User with ID " + id + " not found"));

        if (actorId != null && actorId == id) {
            throw new IllegalArgumentException("You cannot delete your own admin account");
        }
        if (Role.ADMIN.name().equals(Role.normalize(target.getRole())) && userDAO.countByRole(Role.ADMIN.name()) <= 1) {
            throw new IllegalArgumentException("Cannot delete the last remaining admin account");
        }

        try {
            userService.deleteUser(id);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException(
                    "Account cannot be deleted while it still has linked financial or group records");
        }
        auditDAO.record(actorId, actorEmail, "DELETE_ACCOUNT", id, "Deleted account " + target.getEmail());
    }

    // -------------------------------------------------------------- helpers

    /** Shared role-change guardrails used by both changeRole and updateAccount. */
    private void applyRoleChange(User target, String rawRole, Integer actorId) {
        if (!Role.isValid(rawRole == null ? null : rawRole.trim().toUpperCase())) {
            throw new IllegalArgumentException("Invalid role. Must be one of ADMIN, TEST_PROFILE, USER");
        }
        String newRole = Role.normalize(rawRole);
        String currentRole = Role.normalize(target.getRole());

        if (newRole.equals(currentRole)) {
            return; // no-op
        }

        boolean demotingAnAdmin = Role.ADMIN.name().equals(currentRole) && !Role.ADMIN.name().equals(newRole);
        if (demotingAnAdmin) {
            if (actorId != null && actorId == target.getUserId()) {
                throw new IllegalArgumentException("You cannot change your own role away from ADMIN");
            }
            if (userDAO.countByRole(Role.ADMIN.name()) <= 1) {
                throw new IllegalArgumentException("Cannot demote the last remaining admin account");
            }
        }

        userDAO.updateRole(target.getUserId(), newRole);
        target.setRole(newRole);
    }

    private static boolean contains(String value, String needleLower) {
        return value != null && value.toLowerCase().contains(needleLower);
    }

    private static String asString(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o).trim();
        return s.isEmpty() ? null : s;
    }

    private static Long asLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.longValue();
        try {
            String s = String.valueOf(o).trim();
            return s.isEmpty() ? null : Long.parseLong(s);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("phoneNum must be a number");
        }
    }
}
