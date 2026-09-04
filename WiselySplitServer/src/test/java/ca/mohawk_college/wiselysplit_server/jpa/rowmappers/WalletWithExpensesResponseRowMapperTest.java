package ca.mohawk_college.wiselysplit_server.jpa.rowmappers;

import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletWithExpensesResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;
import ca.mohawk_college.wiselysplit_server.jpa.entities.Wallet;
import ca.mohawk_college.wiselysplit_server.jpa.support.TestData;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class WalletWithExpensesResponseRowMapperTest {

    @Test
    void shouldReturnNullWhenWalletIsNull() {
        assertThat(WalletWithExpensesResponseRowMapper.toDto(null, List.of())).isNull();
    }

    @Test
    void shouldMapWalletFieldsAndDelegateEntriesToStubMapper() {
        User owner = TestData.user(1L);
        Wallet wallet = TestData.wallet(7L, owner);

        WalletWithExpensesResponseDTO dto = WalletWithExpensesResponseRowMapper.toDto(wallet, List.of());

        assertThat(dto.walletId()).isEqualTo(7L);
        assertThat(dto.name()).isEqualTo("Chequing");
        assertThat(dto.initialBalance()).isEqualByComparingTo("100.00");
        assertThat(dto.balance()).isEqualByComparingTo("250.00");
        assertThat(dto.cardName()).isEqualTo("tdChequing");
        assertThat(dto.color()).isEqualTo("#111111");
        assertThat(dto.entries()).isNull();
    }
}
