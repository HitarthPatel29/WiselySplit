package ca.mohawk_college.wiselysplit_server.jpa.rowmappers;

import ca.mohawk_college.wiselysplit_server.jpa.constants.ExpenseCategory;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.expense.ExpenseResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Expense;
import ca.mohawk_college.wiselysplit_server.jpa.support.TestData;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ExpenseResponseRowMapperTest {

    private final User payer = TestData.user(1L, "Alice");
    private final User roommate = TestData.user(2L, "Bob");

    @Test
    void shouldReturnNullWhenExpenseIsNull() {
        assertThat(ExpenseResponseRowMapper.toDto(null)).isNull();
    }

    @Test
    void shouldMapSharedExpenseWithParticipantsGroupWalletAndPayment() {
        Expense expense = TestData.sharedExpense(10L, payer, roommate, "100.00", "40.00", "60.00");
        expense.setExpenseGroup(TestData.group(3L));
        expense.setWallet(TestData.wallet(7L, payer));
        expense.setPayment(TestData.payment(9L, payer, roommate));

        ExpenseResponseDTO dto = ExpenseResponseRowMapper.toDto(expense);

        assertThat(dto.getExpenseId()).isEqualTo(10L);
        assertThat(dto.getAmount()).isEqualByComparingTo("100.00");
        assertThat(dto.getCategory()).isEqualTo(ExpenseCategory.FOOD_AND_DINING);
        assertThat(dto.getPayer().userId()).isEqualTo(1L);
        assertThat(dto.getExpenseGroup().groupId()).isEqualTo(3L);
        assertThat(dto.getWallet().walletId()).isEqualTo(7L);
        assertThat(dto.getPaymentId()).isEqualTo(9L);
        assertThat(dto.getParticipants()).hasSize(2);
        assertThat(dto.getParticipants().get(0).amount()).isEqualByComparingTo("40.00");
    }

    @Test
    void shouldOmitParticipantsForPersonalExpense() {
        Expense personal = TestData.personalExpense(11L, payer, "12.50");

        ExpenseResponseDTO dto = ExpenseResponseRowMapper.toDto(personal);

        assertThat(dto.getParticipants()).isNull();
        assertThat(dto.getIsPersonal()).isTrue();
        assertThat(dto.getPayer().userId()).isEqualTo(1L);
        assertThat(dto.getPaymentId()).isNull();
    }

    @Test
    void shouldMapList() {
        List<ExpenseResponseDTO> dtos = ExpenseResponseRowMapper.toDtoList(
                List.of(TestData.personalExpense(1L, payer, "5.00")));

        assertThat(dtos).hasSize(1);
        assertThat(dtos.get(0).getExpenseId()).isEqualTo(1L);
    }
}
