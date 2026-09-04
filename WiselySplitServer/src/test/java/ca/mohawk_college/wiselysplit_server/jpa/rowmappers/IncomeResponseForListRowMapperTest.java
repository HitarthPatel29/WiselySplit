package ca.mohawk_college.wiselysplit_server.jpa.rowmappers;

import ca.mohawk_college.wiselysplit_server.jpa.constants.IncomeCategory;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list.IncomeResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Income;
import ca.mohawk_college.wiselysplit_server.jpa.support.TestData;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class IncomeResponseForListRowMapperTest {

    @Test
    void shouldReturnNullWhenIncomeIsNull() {
        assertThat(IncomeResponseForListRowMapper.toDto(null)).isNull();
    }

    @Test
    void shouldMapUserAndWallet() {
        User owner = TestData.user(4L, "Dana");
        Income income = TestData.income(20L, owner, "2000.00");
        income.setWallet(TestData.wallet(8L, owner));

        IncomeResponseForListDTO dto = IncomeResponseForListRowMapper.toDto(income);

        assertThat(dto.id()).isEqualTo(20L);
        assertThat(dto.amount()).isEqualByComparingTo("2000.00");
        assertThat(dto.category()).isEqualTo(IncomeCategory.SALARY);
        assertThat(dto.wallet().walletId()).isEqualTo(8L);
    }

    @Test
    void shouldMapNullUserAndWallet() {
        Income income = Income.builder()
                .entryId(21L)
                .title("Gift")
                .amount(new BigDecimal("50.00"))
                .date(TestData.DATE)
                .incomeCategory(IncomeCategory.GIFT)
                .build();

        IncomeResponseForListDTO dto = IncomeResponseForListRowMapper.toDto(income);

        assertThat(dto.wallet()).isNull();
    }

    @Test
    void shouldMapList() {
        User owner = TestData.user(4L, "Dana");
        List<IncomeResponseForListDTO> dtos =
                IncomeResponseForListRowMapper.toDtoList(List.of(TestData.income(1L, owner, "10.00")));

        assertThat(dtos).hasSize(1);
        assertThat(dtos.get(0).id()).isEqualTo(1L);
    }
}
