package ca.mohawk_college.wiselysplit_server.jpa.rowmappers;

import ca.mohawk_college.wiselysplit_server.jpa.constants.ExpenseCategory;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list.ExpenseResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.ExpenseGroup;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;
import ca.mohawk_college.wiselysplit_server.jpa.entities.Wallet;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Expense;
import ca.mohawk_college.wiselysplit_server.jpa.support.TestData;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ExpenseResponseForListRowMapperTest {

    private final User payer = TestData.user(1L, "Alice");
    private final User roommate = TestData.user(2L, "Bob");

    @Nested
    class ToDto {

        @Test
        void shouldReturnNullWhenExpenseIsNull() {
            assertThat(ExpenseResponseForListRowMapper.toDto(null, 1L)).isNull();
        }

        @Test
        void shouldLeaveLentOrOwedNullForPersonalExpense() {
            Expense personal = TestData.personalExpense(10L, payer, "30.00");

            ExpenseResponseForListDTO dto = ExpenseResponseForListRowMapper.toDto(personal, 1L);

            assertThat(dto.amountLentOrOwed()).isNull();
            assertThat(dto.amount()).isEqualByComparingTo("30.00");
            assertThat(dto.isPersonal()).isTrue();
            assertThat(dto.payer().userId()).isEqualTo(1L);
        }

        @Test
        void shouldLeaveLentOrOwedNullForSettleUp() {
            Expense settleUp = TestData.sharedExpense(11L, payer, roommate, "50.00", "25.00", "25.00");
            settleUp.setIsSettleUp(true);

            ExpenseResponseForListDTO dto = ExpenseResponseForListRowMapper.toDto(settleUp, 1L);

            assertThat(dto.amountLentOrOwed()).isNull();
            assertThat(dto.isSettleUp()).isTrue();
        }

        @Test
        void shouldMapGroupAndWalletWhenPresent() {
            Expense expense = TestData.sharedExpense(12L, payer, roommate, "100.00", "40.00", "60.00");
            ExpenseGroup group = TestData.group(3L);
            Wallet wallet = TestData.wallet(7L, payer);
            expense.setExpenseGroup(group);
            expense.setWallet(wallet);

            ExpenseResponseForListDTO dto = ExpenseResponseForListRowMapper.toDto(expense, 1L);

            assertThat(dto.expenseGroup().groupId()).isEqualTo(3L);
            assertThat(dto.expenseGroup().groupName()).isEqualTo("Trip");
            assertThat(dto.wallet().walletId()).isEqualTo(7L);
            assertThat(dto.category()).isEqualTo(ExpenseCategory.FOOD_AND_DINING);
        }

        @Test
        void shouldMapNullPayerGroupAndWallet() {
            Expense expense = Expense.builder()
                    .entryId(13L)
                    .title("Orphan")
                    .amount(new BigDecimal("1.00"))
                    .date(TestData.DATE)
                    .isPersonal(true)
                    .isSettleUp(false)
                    .build();

            ExpenseResponseForListDTO dto = ExpenseResponseForListRowMapper.toDto(expense, 1L);

            assertThat(dto.payer()).isNull();
            assertThat(dto.expenseGroup()).isNull();
            assertThat(dto.wallet()).isNull();
        }
    }

    @Nested
    class ComputeAmountLentOrOwedByCurrentUser {

        @Test
        void shouldReturnPositiveLentWhenCurrentUserIsPayer() {
            Expense expense = TestData.sharedExpense(20L, payer, roommate, "100.00", "40.00", "60.00");

            BigDecimal lent = ExpenseResponseForListRowMapper.computeAmountLentOrOwedByCurrentUser(expense, 1L);

            assertThat(lent).isEqualByComparingTo("60.00");
        }

        @Test
        void shouldReturnNegativeOwedWhenCurrentUserIsNotPayer() {
            Expense expense = TestData.sharedExpense(21L, payer, roommate, "100.00", "40.00", "60.00");

            BigDecimal owed = ExpenseResponseForListRowMapper.computeAmountLentOrOwedByCurrentUser(expense, 2L);

            assertThat(owed).isEqualByComparingTo("-60.00");
        }

        @Test
        void shouldTreatMissingParticipationAsZeroContribution() {
            Expense expense = TestData.sharedExpense(22L, payer, roommate, "80.00", "80.00", "0.00");
            expense.getParticipants().removeIf(p -> p.getUser().getUserId().equals(2L));

            BigDecimal asPayer = ExpenseResponseForListRowMapper.computeAmountLentOrOwedByCurrentUser(expense, 1L);
            BigDecimal asStranger = ExpenseResponseForListRowMapper.computeAmountLentOrOwedByCurrentUser(expense, 99L);

            assertThat(asPayer).isEqualByComparingTo("80.00");
            assertThat(asStranger).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    class ToDtoList {

        @Test
        void shouldMapEachExpenseFromTheViewersPerspective() {
            Expense shared = TestData.sharedExpense(30L, payer, roommate, "100.00", "40.00", "60.00");
            Expense personal = TestData.personalExpense(31L, payer, "10.00");

            List<ExpenseResponseForListDTO> dtos =
                    ExpenseResponseForListRowMapper.toDtoList(List.of(shared, personal), 1L);

            assertThat(dtos).hasSize(2);
            assertThat(dtos.get(0).amountLentOrOwed()).isEqualByComparingTo("60.00");
            assertThat(dtos.get(1).amountLentOrOwed()).isNull();
        }
    }
}
