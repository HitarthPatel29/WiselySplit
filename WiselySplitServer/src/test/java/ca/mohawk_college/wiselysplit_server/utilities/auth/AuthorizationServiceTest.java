package ca.mohawk_college.wiselysplit_server.utilities.auth;

import ca.mohawk_college.wiselysplit_server.jpa.repositories.ExpenseGroupRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.InviteRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.PaymentRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.WalletRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.entry.ExpenseRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.entry.IncomeRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.entry.TransferRepo;
import ca.mohawk_college.wiselysplit_server.jpa.support.SecurityTestSupport;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthorizationServiceTest {

    @Mock private ExpenseRepo expenseRepo;
    @Mock private WalletRepo walletRepo;
    @Mock private IncomeRepo incomeRepo;
    @Mock private TransferRepo transferRepo;
    @Mock private ExpenseGroupRepo expenseGroupRepo;
    @Mock private InviteRepo inviteRepo;
    @Mock private PaymentRepo paymentRepo;

    @InjectMocks
    private AuthorizationService authz;

    @AfterEach
    void tearDown() {
        SecurityTestSupport.clearContext();
    }

    @Nested
    class FailClosed {

        @Test
        void shouldDenyWhenThereIsNoAuthenticatedPrincipal() {
            assertThatThrownBy(() -> authz.requireSelf(1L))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Not authenticated");
            verifyNoInteractions(expenseRepo, walletRepo, incomeRepo, transferRepo,
                    expenseGroupRepo, inviteRepo, paymentRepo);
        }

        @Test
        void shouldDenyWhenOwnershipLookupReturnsFalse() {
            SecurityTestSupport.asUser(1L);
            when(expenseRepo.existsIfUserIsPayerParticipantOrGroupMember(99L, 1L)).thenReturn(false);

            assertThat(authz.canAccessExpense(99L)).isFalse();
            assertThatThrownBy(() -> authz.requireCanAccessExpense(99L))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessage("Access denied");
        }
    }

    @Nested
    class AdminBypass {

        @BeforeEach
        void asAdmin() {
            SecurityTestSupport.asAdmin(1L);
        }

        @Test
        void shouldAllowEveryCheckWithoutTouchingRepositories() {
            assertThat(authz.isSelf(999L)).isTrue();
            assertThat(authz.canAccessExpense(1L)).isTrue();
            assertThat(authz.ownsWallet(1L)).isTrue();
            assertThat(authz.ownsIncome(1L)).isTrue();
            assertThat(authz.ownsTransfer(1L)).isTrue();
            assertThat(authz.isGroupMember(1L)).isTrue();
            assertThat(authz.canReadInvite(1L)).isTrue();
            assertThat(authz.isInviteRecipient(1L)).isTrue();
            assertThat(authz.isPaymentParty(1L)).isTrue();

            verifyNoInteractions(expenseRepo, walletRepo, incomeRepo, transferRepo,
                    expenseGroupRepo, inviteRepo, paymentRepo);
        }

        @Test
        void requireMethodsShouldNotThrowForAdmin() {
            assertThatNoException().isThrownBy(
                    () -> {
                        authz.requireSelf(42L);
                        authz.requireCanAccessExpense(1L);
                        authz.requireOwnsWallet(1L);
                        authz.requireOwnsIncome(1L);
                        authz.requireOwnsTransfer(1L);
                        authz.requireGroupMember(1L);
                        authz.requireCanReadInvite(1L);
                        authz.requireInviteRecipient(1L);
                        authz.requirePaymentParty(1L);
                    }
            );
        }
    }

    @Nested
    class OwnerChecks {

        @BeforeEach
        void asUser() {
            SecurityTestSupport.asUser(7L);
        }

        @Test
        void isSelfShouldMatchJwtUserId() {
            assertThat(authz.isSelf(7L)).isTrue();
            assertThat(authz.isSelf(8L)).isFalse();
            assertThatThrownBy(() -> authz.requireSelf(8L)).isInstanceOf(AccessDeniedException.class);
        }

        @Test
        void canAccessExpenseShouldDelegateToRepo() {
            when(expenseRepo.existsIfUserIsPayerParticipantOrGroupMember(10L, 7L)).thenReturn(true);

            assertThat(authz.canAccessExpense(10L)).isTrue();
            authz.requireCanAccessExpense(10L);
            verify(expenseRepo).existsIfUserIsPayerParticipantOrGroupMember(10L, 7L);
        }

        @Test
        void ownsWalletShouldDelegateToRepo() {
            when(walletRepo.existsByWalletIdAndUser_UserId(3L, 7L)).thenReturn(true);
            assertThat(authz.ownsWallet(3L)).isTrue();
            authz.requireOwnsWallet(3L);
        }

        @Test
        void ownsIncomeShouldDelegateToRepo() {
            when(incomeRepo.existsByEntryIdAndUser_UserId(4L, 7L)).thenReturn(false);
            assertThat(authz.ownsIncome(4L)).isFalse();
            assertThatThrownBy(() -> authz.requireOwnsIncome(4L)).isInstanceOf(AccessDeniedException.class);
            verify(walletRepo, never()).existsByWalletIdAndUser_UserId(anyLong(), anyLong());
        }

        @Test
        void ownsTransferShouldDelegateToRepo() {
            when(transferRepo.existsByEntryIdAndUser_UserId(5L, 7L)).thenReturn(true);
            assertThat(authz.ownsTransfer(5L)).isTrue();
            authz.requireOwnsTransfer(5L);
        }

        @Test
        void isGroupMemberShouldDelegateToRepo() {
            when(expenseGroupRepo.existsByGroupIdAndParticipantUserId(6L, 7L)).thenReturn(true);
            assertThat(authz.isGroupMember(6L)).isTrue();
            authz.requireGroupMember(6L);
        }

        @Test
        void canReadInviteShouldDelegateToRepo() {
            when(inviteRepo.existsReadableByUser(8L, 7L)).thenReturn(true);
            assertThat(authz.canReadInvite(8L)).isTrue();
            authz.requireCanReadInvite(8L);
        }

        @Test
        void isInviteRecipientShouldDelegateToRepo() {
            when(inviteRepo.existsByInviteIdAndReceiver_UserId(9L, 7L)).thenReturn(false);
            assertThat(authz.isInviteRecipient(9L)).isFalse();
            assertThatThrownBy(() -> authz.requireInviteRecipient(9L)).isInstanceOf(AccessDeniedException.class);
        }

        @Test
        void isPaymentPartyShouldDelegateToRepo() {
            when(paymentRepo.existsByPaymentIdAndPartyUserId(11L, 7L)).thenReturn(true);
            assertThat(authz.isPaymentParty(11L)).isTrue();
            authz.requirePaymentParty(11L);
        }
    }
}
