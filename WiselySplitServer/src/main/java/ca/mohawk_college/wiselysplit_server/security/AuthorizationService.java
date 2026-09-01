package ca.mohawk_college.wiselysplit_server.security;

import ca.mohawk_college.wiselysplit_server.jpa.repositories.ExpenseGroupRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.InviteRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.PaymentRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.WalletRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.entry.ExpenseRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.entry.IncomeRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.entry.TransferRepo;
import ca.mohawk_college.wiselysplit_server.utilities.auth.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/**
 * Object-level authorization policies. Called from {@code @PreAuthorize("@authz....")}
 * or from services via the {@code require*} methods.
 *
 * <p>Every check is a per-request DB lookup against the JWT principal — no session state.
 * ADMIN bypasses all ownership checks.
 *
 * <p>Bean name {@code authz} is what SpEL uses: {@code @PreAuthorize("@authz.canReadExpense(#expenseId)")}.
 */
@Component("authz")
public class AuthorizationService {

    private final ExpenseRepo expenseRepo;
    private final WalletRepo walletRepo;
    private final IncomeRepo incomeRepo;
    private final TransferRepo transferRepo;
    private final ExpenseGroupRepo expenseGroupRepo;
    private final InviteRepo inviteRepo;
    private final PaymentRepo paymentRepo;

    public AuthorizationService(ExpenseRepo expenseRepo,
                                WalletRepo walletRepo,
                                IncomeRepo incomeRepo,
                                TransferRepo transferRepo,
                                ExpenseGroupRepo expenseGroupRepo,
                                InviteRepo inviteRepo,
                                PaymentRepo paymentRepo) {
        this.expenseRepo = expenseRepo;
        this.walletRepo = walletRepo;
        this.incomeRepo = incomeRepo;
        this.transferRepo = transferRepo;
        this.expenseGroupRepo = expenseGroupRepo;
        this.inviteRepo = inviteRepo;
        this.paymentRepo = paymentRepo;
    }

    public boolean isSelf(long userId) {
        if (SecurityUtils.isAdmin()) {
            return true;
        }
        return SecurityUtils.currentUserIdOrThrow() == userId;
    }

    public boolean canReadExpense(long expenseId) {
        if (SecurityUtils.isAdmin()) {
            return true;
        }
        return expenseRepo.existsReadableByUser(expenseId, SecurityUtils.currentUserIdOrThrow());
    }

    public boolean canWriteExpense(long expenseId) {
        if (SecurityUtils.isAdmin()) {
            return true;
        }
        return expenseRepo.existsWritableByUser(expenseId, SecurityUtils.currentUserIdOrThrow());
    }

    public boolean ownsWallet(long walletId) {
        if (SecurityUtils.isAdmin()) {
            return true;
        }
        return walletRepo.existsByWalletIdAndUser_UserId(walletId, SecurityUtils.currentUserIdOrThrow());
    }

    public boolean ownsIncome(long incomeId) {
        if (SecurityUtils.isAdmin()) {
            return true;
        }
        return incomeRepo.existsByEntryIdAndUser_UserId(incomeId, SecurityUtils.currentUserIdOrThrow());
    }

    public boolean ownsTransfer(long transferId) {
        if (SecurityUtils.isAdmin()) {
            return true;
        }
        return transferRepo.existsByEntryIdAndUser_UserId(transferId, SecurityUtils.currentUserIdOrThrow());
    }

    public boolean isGroupMember(long groupId) {
        if (SecurityUtils.isAdmin()) {
            return true;
        }
        return expenseGroupRepo.existsByGroupIdAndParticipantUserId(groupId, SecurityUtils.currentUserIdOrThrow());
    }

    public boolean canReadInvite(long inviteId) {
        if (SecurityUtils.isAdmin()) {
            return true;
        }
        return inviteRepo.existsReadableByUser(inviteId, SecurityUtils.currentUserIdOrThrow());
    }

    public boolean isInviteRecipient(long inviteId) {
        if (SecurityUtils.isAdmin()) {
            return true;
        }
        return inviteRepo.existsByInviteIdAndReceiver_UserId(inviteId, SecurityUtils.currentUserIdOrThrow());
    }

    public boolean isPaymentParty(long paymentId) {
        if (SecurityUtils.isAdmin()) {
            return true;
        }
        return paymentRepo.existsByPaymentIdAndPartyUserId(paymentId, SecurityUtils.currentUserIdOrThrow());
    }

    public void requireSelf(long userId) {
        denyUnless(isSelf(userId));
    }

    public void requireCanReadExpense(long expenseId) {
        denyUnless(canReadExpense(expenseId));
    }

    public void requireCanWriteExpense(long expenseId) {
        denyUnless(canWriteExpense(expenseId));
    }

    public void requireOwnsWallet(long walletId) {
        denyUnless(ownsWallet(walletId));
    }

    public void requireOwnsIncome(long incomeId) {
        denyUnless(ownsIncome(incomeId));
    }

    public void requireOwnsTransfer(long transferId) {
        denyUnless(ownsTransfer(transferId));
    }

    public void requireGroupMember(long groupId) {
        denyUnless(isGroupMember(groupId));
    }

    public void requireCanReadInvite(long inviteId) {
        denyUnless(canReadInvite(inviteId));
    }

    public void requireInviteRecipient(long inviteId) {
        denyUnless(isInviteRecipient(inviteId));
    }

    public void requirePaymentParty(long paymentId) {
        denyUnless(isPaymentParty(paymentId));
    }

    private static void denyUnless(boolean allowed) {
        if (!allowed) {
            throw new AccessDeniedException("Access denied");
        }
    }
}
