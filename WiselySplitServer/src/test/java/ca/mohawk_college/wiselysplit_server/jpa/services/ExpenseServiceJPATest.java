package ca.mohawk_college.wiselysplit_server.jpa.services;

import ca.mohawk_college.wiselysplit_server.daos.ExpensesDAO;
import ca.mohawk_college.wiselysplit_server.daos.PaymentDAO;
import ca.mohawk_college.wiselysplit_server.daos.WalletDAO;
import ca.mohawk_college.wiselysplit_server.exceptions.BusinessException;
import ca.mohawk_college.wiselysplit_server.exceptions.UserNotFoundException;
import ca.mohawk_college.wiselysplit_server.jpa.constants.ExpenseCategory;
import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.PersonalSummaryResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expense.ExpenseUpdateRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expense.PersonalExpenseAutomationRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expense.PersonalExpenseRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expense.SharedExpenseRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expenseparticipation.ExpenseParticipantRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;
import ca.mohawk_college.wiselysplit_server.jpa.entities.Wallet;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Expense;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Income;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.ExpenseGroupRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.PaymentRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.UserRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.WalletRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.entry.EntryRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.entry.ExpenseRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.entry.IncomeRepo;
import ca.mohawk_college.wiselysplit_server.jpa.support.TestData;
import ca.mohawk_college.wiselysplit_server.models.dtos.PersonalExpenseImportDTO;
import ca.mohawk_college.wiselysplit_server.services.classification.ClassificationService;
import ca.mohawk_college.wiselysplit_server.services.classification.FeedbackService;
import ca.mohawk_college.wiselysplit_server.utilities.auth.AuthorizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceJPATest {

    @Mock private UserRepo userRepo;
    @Mock private ExpenseGroupRepo groupRepo;
    @Mock private PaymentRepo paymentRepo;
    @Mock private WalletRepo walletRepo;
    @Mock private ExpensesDAO expensesDAO;
    @Mock private WalletDAO walletDAO;
    @Mock private PaymentDAO paymentDAO;
    @Mock private ClassificationService classificationService;
    @Mock private FeedbackService feedbackService;
    @Mock private ExpenseRepo expenseRepo;
    @Mock private EntryRepo entryRepo;
    @Mock private IncomeRepo incomeRepo;
    @Mock private AuthorizationService authzService;

    @InjectMocks
    private ExpenseServiceJPA service;

    private final User alice = TestData.user(1L, "Alice");
    private final User bob = TestData.user(2L, "Bob");

    @BeforeEach
    void stubSave() {
        org.mockito.Mockito.lenient().when(expenseRepo.save(any(Expense.class))).thenAnswer(invocation -> {
            Expense expense = invocation.getArgument(0);
            if (expense.getEntryId() == null) {
                expense.setEntryId(100L);
            }
            return expense;
        });
    }

    private void stubUserReferences() {
        when(userRepo.getReferenceById(anyLong())).thenAnswer(invocation -> {
            long id = invocation.getArgument(0);
            return id == 1L ? alice : TestData.user(id);
        });
    }

    @Nested
    class CreateSharedExpense {

        @Test
        void shouldRejectMissingPayer() {
            SharedExpenseRequestDTO request = TestData.sharedRequest(
                    null, "100.00", List.of(TestData.participant(1L, "100.00")));

            assertThatThrownBy(() -> service.createSharedExpense(request))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.PAYER_NOT_FOUND);
            verifyNoInteractions(expenseRepo);
        }

        @Test
        void shouldRejectNullParticipants() {
            SharedExpenseRequestDTO request = new SharedExpenseRequestDTO(
                    "Dinner", new BigDecimal("100.00"), TestData.DATE, ExpenseCategory.FOOD_AND_DINING,
                    1L, null, false, null, null, null, ExpenseCategory.FOOD_AND_DINING);

            assertThatThrownBy(() -> service.createSharedExpense(request))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.PARTICIPANTS_REQUIRED);
        }

        @Test
        void shouldRejectEmptyParticipants() {
            SharedExpenseRequestDTO request = TestData.sharedRequest(1L, "100.00", List.of());

            assertThatThrownBy(() -> service.createSharedExpense(request))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.PARTICIPANTS_REQUIRED);
        }

        @Test
        void shouldRejectWhenEveryContributionIsZeroOrNegative() {
            SharedExpenseRequestDTO request = TestData.sharedRequest(1L, "100.00", List.of(
                    TestData.participant(1L, "0.00"),
                    TestData.participant(2L, "-5.00")));

            assertThatThrownBy(() -> service.createSharedExpense(request))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.PARTICIPANTS_REQUIRED);
        }

        @ParameterizedTest
        @CsvSource({
                "100.00, 50.00, 49.99",
                "100.00, 50.00, 50.01",
                "10.00, 10.00, 0.01"
        })
        void shouldRejectWhenParticipantSumDoesNotMatchTotal(String total, String shareA, String shareB) {
            SharedExpenseRequestDTO request = TestData.sharedRequest(1L, total, List.of(
                    TestData.participant(1L, shareA),
                    TestData.participant(2L, shareB)));

            assertThatThrownBy(() -> service.createSharedExpense(request))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.SPLIT_AMOUNT_MISMATCH);
        }

        @Test
        void shouldSaveWhenSharesMatchAndSkipWalletUpdateWithoutWalletId() {
            stubUserReferences();
            SharedExpenseRequestDTO request = TestData.sharedRequest(1L, "100.00", List.of(
                    TestData.participant(1L, "40.00"),
                    TestData.participant(2L, "60.00")));

            Long id = service.createSharedExpense(request);

            assertThat(id).isEqualTo(100L);
            ArgumentCaptor<Expense> captor = ArgumentCaptor.forClass(Expense.class);
            verify(expenseRepo).save(captor.capture());
            Expense saved = captor.getValue();
            assertThat(saved.getAmount()).isEqualByComparingTo("100.00");
            assertThat(saved.getIsPersonal()).isFalse();
            assertThat(saved.getParticipants()).hasSize(2);
            verify(walletDAO, never()).updateWalletBalance(anyLong(), anyLong(), anyDouble(), any());
        }

        @Test
        void shouldUpdateWalletWhenWalletIdPresent() {
            stubUserReferences();
            Wallet wallet = TestData.wallet(11L, alice);
            when(walletRepo.getReferenceById(11L)).thenReturn(wallet);

            SharedExpenseRequestDTO request = new SharedExpenseRequestDTO(
                    "Dinner", new BigDecimal("100.00"), TestData.DATE, ExpenseCategory.FOOD_AND_DINING,
                    1L, null, false, 11L, null,
                    List.of(TestData.participant(1L, "50.00"), TestData.participant(2L, "50.00")),
                    ExpenseCategory.FOOD_AND_DINING);

            service.createSharedExpense(request);

            verify(walletDAO).updateWalletBalance(1L, 11L, 100.0, WalletDAO.WalletBalanceUpdateMode.EXPENSE);
        }

        @Test
        void shouldAttachGroupAndPaymentWhenIdsPresent() {
            stubUserReferences();
            when(groupRepo.getReferenceById(3L)).thenReturn(TestData.group(3L));
            when(paymentRepo.getReferenceById(9L)).thenReturn(TestData.payment(9L, alice, bob));

            SharedExpenseRequestDTO request = new SharedExpenseRequestDTO(
                    "Dinner", new BigDecimal("50.00"), TestData.DATE, ExpenseCategory.FOOD_AND_DINING,
                    1L, 3L, true, null, 9L,
                    List.of(TestData.participant(1L, "50.00")),
                    null);

            service.createSharedExpense(request);

            ArgumentCaptor<Expense> captor = ArgumentCaptor.forClass(Expense.class);
            verify(expenseRepo).save(captor.capture());
            assertThat(captor.getValue().getExpenseGroup().getGroupId()).isEqualTo(3L);
            assertThat(captor.getValue().getPayment().getPaymentId()).isEqualTo(9L);
            assertThat(captor.getValue().getIsSettleUp()).isTrue();
        }

        @Test
        void shouldNotFailCreateWhenClassifierFeedbackThrows() {
            stubUserReferences();
            doThrow(new RuntimeException("classifier down"))
                    .when(feedbackService).recordFeedback(anyString(), anyString(), anyString(), anyLong());

            Long id = service.createSharedExpense(TestData.sharedRequest(1L, "20.00", List.of(
                    TestData.participant(1L, "20.00"))));

            assertThat(id).isEqualTo(100L);
            verify(expenseRepo).save(any(Expense.class));
        }
    }

    @Nested
    class CreatePersonalExpense {

        @Test
        void shouldRejectMissingPayer() {
            PersonalExpenseRequestDTO request = TestData.personalRequest(null, null, "12.00");

            assertThatThrownBy(() -> service.createPersonalExpense(request))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.PAYER_NOT_FOUND);
        }

        @Test
        void shouldSkipWalletUpdateWhenWalletIdIsNull() {
            when(userRepo.getReferenceById(1L)).thenReturn(alice);

            Long id = service.createPersonalExpense(TestData.personalRequest(1L, null, "12.50"));

            assertThat(id).isEqualTo(100L);
            verify(walletDAO, never()).updateWalletBalance(anyLong(), anyLong(), anyDouble(), any());
            ArgumentCaptor<Expense> captor = ArgumentCaptor.forClass(Expense.class);
            verify(expenseRepo).save(captor.capture());
            assertThat(captor.getValue().getIsPersonal()).isTrue();
            assertThat(captor.getValue().getAmount()).isEqualByComparingTo("12.50");
        }

        @Test
        void shouldUpdateWalletWhenWalletIdPresent() {
            when(userRepo.getReferenceById(1L)).thenReturn(alice);
            when(walletRepo.getReferenceById(11L)).thenReturn(TestData.wallet(11L, alice));

            service.createPersonalExpense(TestData.personalRequest(1L, 11L, "8.00"));

            verify(walletDAO).updateWalletBalance(1L, 11L, 8.0, WalletDAO.WalletBalanceUpdateMode.EXPENSE);
        }
    }

    @Nested
    class CreatePersonalExpensesBatch {

        @Test
        void shouldReturnZerosForEmptyOrNullRows() {
            assertThat(service.createPersonalExpensesBatch(null))
                    .containsEntry("inserted", 0);
            assertThat(service.createPersonalExpensesBatch(List.of()))
                    .containsEntry("inserted", 0);
            verifyNoInteractions(expensesDAO, walletDAO);
        }

        @Test
        void shouldCountInsertedAndSkippedAndSumWalletOnce() {
            PersonalExpenseImportDTO inserted = importRow("Coffee", 10.00, 11L);
            PersonalExpenseImportDTO skipped = importRow("Duplicate", 5.00, 11L);
            when(classificationService.predict(anyString()))
                    .thenReturn(new ClassificationService.Prediction("Food & Dining", 0.9, true));
            when(classificationService.predict("Duplicate")).thenThrow(new RuntimeException("model"));
            when(expensesDAO.batchInsertPersonalExpenses(anyList(), anyList())).thenReturn(new int[]{1, 0});

            @SuppressWarnings("unchecked")
            Map<String, Object> result = service.createPersonalExpensesBatch(List.of(inserted, skipped));

            assertThat(result.get("inserted")).isEqualTo(1);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> skippedRows = (List<Map<String, Object>>) result.get("skipped");
            assertThat(skippedRows).hasSize(1);
            assertThat(skippedRows.get(0).get("title")).isEqualTo("Duplicate");
            verify(walletDAO).updateWalletBalance(1L, 11L, 10.00, WalletDAO.WalletBalanceUpdateMode.EXPENSE);
        }

        private PersonalExpenseImportDTO importRow(String title, double amount, Long walletId) {
            PersonalExpenseImportDTO row = new PersonalExpenseImportDTO();
            row.setTitle(title);
            row.setDate("2026-03-15");
            row.setAmount(amount);
            row.setPayerId(1L);
            row.setWalletId(walletId);
            return row;
        }
    }

    @Nested
    class CreatePersonalExpenseWithAutomation {

        @Test
        void shouldRejectUnknownEmail() {
            PersonalExpenseAutomationRequestDTO request = automation("$12.50");
            when(userRepo.findByEmail("alice@example.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.createPersonalExpenseWithAutomation(request))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        void shouldRejectUnknownWallet() {
            when(userRepo.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));
            when(classificationService.predict(anyString())).thenReturn(null);
            when(walletRepo.findByCardNameAndUserID("tdChequing", 1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.createPersonalExpenseWithAutomation(automation("$12.50")))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.WALLET_NOT_FOUND);
        }

        @Test
        void shouldRejectZeroAmountAfterSanitize() {
            when(userRepo.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));
            when(classificationService.predict(anyString()))
                    .thenReturn(new ClassificationService.Prediction("Food & Dining", 0.8, true));

            assertThatThrownBy(() -> service.createPersonalExpenseWithAutomation(automation("$0.00")))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.INVALID_AMOUNT);
        }

        @Test
        void shouldSanitizeCurrencyStringAndSave() {
            when(userRepo.findByEmail("alice@example.com")).thenReturn(Optional.of(alice));
            when(classificationService.predict("Diner"))
                    .thenReturn(new ClassificationService.Prediction("Food & Dining", 0.9, true));
            when(walletRepo.findByCardNameAndUserID("tdChequing", 1L))
                    .thenReturn(Optional.of(TestData.wallet(11L, alice)));

            Long id = service.createPersonalExpenseWithAutomation(automation("$12.50"));

            assertThat(id).isEqualTo(100L);
            ArgumentCaptor<Expense> captor = ArgumentCaptor.forClass(Expense.class);
            verify(expenseRepo).save(captor.capture());
            assertThat(captor.getValue().getAmount()).isEqualByComparingTo("12.50");
            assertThat(captor.getValue().getExpenseCategory()).isEqualTo(ExpenseCategory.FOOD_AND_DINING);
            verify(walletDAO).updateWalletBalance(eq(1L), eq(11L), anyDouble(), eq(WalletDAO.WalletBalanceUpdateMode.EXPENSE));
        }

        private PersonalExpenseAutomationRequestDTO automation(String amount) {
            return new PersonalExpenseAutomationRequestDTO(
                    "Diner", amount, "tdChequing", TestData.DATE, "alice@example.com", "secret");
        }
    }

    @Nested
    class CreatePayment {

        @Test
        void shouldDelegateToPaymentDao() {
            when(paymentDAO.addPayment(40.0, 1L, 2L, null, null, "PENDING")).thenReturn(55L);

            Map<String, Object> result = service.createPayment(Map.of(
                    "amount", 40,
                    "payerId", 1,
                    "receiverId", 2));

            assertThat(result.get("success")).isEqualTo(true);
            assertThat(result.get("paymentId")).isEqualTo(55L);
        }

        @Test
        void shouldWrapInvalidPayloadAsRuntimeException() {
            assertThatThrownBy(() -> service.createPayment(Map.of("amount", "not-a-number")))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Error creating payment");
        }
    }

    @Nested
    class GetPersonalSummary {

        @Test
        void shouldRejectInvertedDateRange() {
            LocalDate start = LocalDate.of(2026, 3, 20);
            LocalDate end = LocalDate.of(2026, 3, 1);

            assertThatThrownBy(() -> service.getPersonalSummary(1L, start, end))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.INVALID_DATE_RANGE);
            verify(authzService).requireSelf(1L);
        }

        @Test
        void shouldRejectUnknownUser() {
            when(userRepo.existsById(1L)).thenReturn(false);

            assertThatThrownBy(() -> service.getPersonalSummary(1L, TestData.DATE, TestData.DATE))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.USER_NOT_FOUND);
        }

        @Test
        void shouldComputeNetStandingExcludingPersonalAndSettleUpFromLentOwed() {
            when(userRepo.existsById(1L)).thenReturn(true);
            Expense shared = TestData.sharedExpense(1L, alice, bob, "100.00", "40.00", "60.00");
            Expense personal = TestData.personalExpense(2L, alice, "30.00");
            Expense settleUp = TestData.sharedExpense(3L, alice, bob, "20.00", "10.00", "10.00");
            settleUp.setIsSettleUp(true);
            Expense owedToAlice = TestData.sharedExpense(4L, bob, alice, "50.00", "30.00", "20.00");
            when(expenseRepo.findAllByPayerOrParticipantAndDateRange(eq(1L), any(), any()))
                    .thenReturn(List.of(shared, personal, settleUp, owedToAlice));
            Income salary = TestData.income(9L, alice, "200.00");
            when(incomeRepo.findAllByUserIdAndDateRange(eq(1L), any(), any())).thenReturn(List.of(salary));

            PersonalSummaryResponseDTO summary = service.getPersonalSummary(1L, TestData.DATE, TestData.DATE);

            assertThat(summary.getTotalIncome()).isEqualByComparingTo("200.00");
            assertThat(summary.getTotalExpense()).isEqualByComparingTo("150.00");
            assertThat(summary.getTotalAmountLent()).isEqualByComparingTo("60.00");
            assertThat(summary.getTotalAmountOwed()).isEqualByComparingTo("-20.00");
            // myPortion = 150 - 60 = 90; myNet = 90 + (-20) = 70; netStanding = 200 - 70 = 130
            assertThat(summary.getNetStanding()).isEqualByComparingTo("130.00");
        }
    }

    @Nested
    class GetExpenseDetails {

        @Test
        void shouldRequireAccessThenLoad() {
            Expense expense = TestData.personalExpense(10L, alice, "9.00");
            when(expenseRepo.findById(10L)).thenReturn(Optional.of(expense));

            assertThat(service.getExpenseDetails(10L).getExpenseId()).isEqualTo(10L);
            verify(authzService).requireCanAccessExpense(10L);
        }

        @Test
        void shouldRejectMissingExpense() {
            when(expenseRepo.findById(10L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getExpenseDetails(10L))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.EXPENSE_NOT_FOUND);
        }
    }

    @Nested
    class GetExpensesGroupedByWallet {

        @Test
        void shouldRejectUnknownUser() {
            when(userRepo.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getExpensesGroupedByWallet(1L))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.USER_NOT_FOUND);
            verify(authzService).requireSelf(1L);
        }

        @Test
        void shouldRejectNullWallets() {
            alice.setWallets(null);
            when(userRepo.findById(1L)).thenReturn(Optional.of(alice));

            assertThatThrownBy(() -> service.getExpensesGroupedByWallet(1L))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.NO_WALLETS_FOUND);
        }

        @Test
        void shouldGroupEntriesByWallet() {
            Wallet wallet = TestData.wallet(11L, alice);
            alice.setWallets(List.of(wallet));
            when(userRepo.findById(1L)).thenReturn(Optional.of(alice));
            when(entryRepo.findAllByWallet(11L)).thenReturn(List.of());

            assertThat(service.getExpensesGroupedByWallet(1L)).hasSize(1);
            verify(entryRepo).findAllByWallet(11L);
        }
    }

    @Nested
    class DeleteExpense {

        @Test
        void shouldDeleteAndAdjustWalletWhenPresent() {
            when(expenseRepo.existsById(10L)).thenReturn(true);

            service.deleteExpense(10L);

            verify(authzService).requireCanAccessExpense(10L);
            verify(expenseRepo).deleteById(10L);
            verify(walletDAO).updateWalletBalanceForEntryDelete(10L, WalletDAO.WalletBalanceUpdateMode.EXPENSE);
        }

        @Test
        void shouldRejectMissingExpense() {
            when(expenseRepo.existsById(10L)).thenReturn(false);

            assertThatThrownBy(() -> service.deleteExpense(10L))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.EXPENSE_DELETE_FAILED);
        }
    }

    @Nested
    class UpdateExpense {

        @Test
        void shouldRejectMissingExpense() {
            when(expenseRepo.findById(10L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.updateExpense(updateDto(true, null)))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.EXPENSE_UPDATE_FAILED);
            verify(authzService).requireCanAccessExpense(10L);
        }

        @Test
        void shouldRejectMissingPayer() {
            Expense existing = TestData.personalExpense(10L, alice, "9.00");
            when(expenseRepo.findById(10L)).thenReturn(Optional.of(existing));
            ExpenseUpdateRequestDTO dto = new ExpenseUpdateRequestDTO(
                    10L, "Coffee", new BigDecimal("9.00"), TestData.DATE, ExpenseCategory.FOOD_AND_DINING,
                    null, null, false, true, null, null, null, null, null, null);

            assertThatThrownBy(() -> service.updateExpense(dto))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.PAYER_NOT_FOUND);
        }

        @Test
        void shouldReplaceParticipantsOnSharedUpdate() {
            stubUserReferences();
            Expense existing = TestData.sharedExpense(10L, alice, bob, "100.00", "40.00", "60.00");
            when(expenseRepo.findById(10L)).thenReturn(Optional.of(existing));
            when(walletRepo.getReferenceById(11L)).thenReturn(TestData.wallet(11L, alice));

            ExpenseUpdateRequestDTO dto = new ExpenseUpdateRequestDTO(
                    10L, "Dinner", new BigDecimal("100.00"), TestData.DATE, ExpenseCategory.FOOD_AND_DINING,
                    1L, null, false, false, 11L, null, null, null,
                    List.of(TestData.participant(1L, "55.00"), TestData.participant(2L, "45.00")),
                    ExpenseCategory.FOOD_AND_DINING);

            service.updateExpense(dto);

            verify(walletDAO).updateWalletBalanceForEntryUpdate(
                    1L, 11L, 10L, 100.0, WalletDAO.WalletBalanceUpdateMode.EXPENSE);
            ArgumentCaptor<Expense> captor = ArgumentCaptor.forClass(Expense.class);
            verify(expenseRepo).save(captor.capture());
            assertThat(captor.getValue().getParticipants())
                    .extracting(p -> p.getContribution())
                    .usingComparatorForType(BigDecimal::compareTo, BigDecimal.class)
                    .containsExactlyInAnyOrder(new BigDecimal("55.00"), new BigDecimal("45.00"));
        }

        private ExpenseUpdateRequestDTO updateDto(boolean personal, List<ExpenseParticipantRequestDTO> participants) {
            return new ExpenseUpdateRequestDTO(
                    10L, "Coffee", new BigDecimal("9.00"), TestData.DATE, ExpenseCategory.FOOD_AND_DINING,
                    1L, null, false, personal, null, null, null, null, participants, null);
        }
    }

    @Nested
    class AuthzIsFailClosed {

        @Test
        void summaryShouldNotQueryWhenRequireSelfThrows() {
            doThrow(new AccessDeniedException("Access denied")).when(authzService).requireSelf(1L);

            assertThatThrownBy(() -> service.getPersonalSummary(1L, TestData.DATE, TestData.DATE))
                    .isInstanceOf(AccessDeniedException.class);
            verify(userRepo, never()).existsById(anyLong());
        }
    }
}
