package ca.mohawk_college.wiselysplit_server.jpa.services;

import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.Wallet;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.WalletRepo;
import ca.mohawk_college.wiselysplit_server.jpa.support.TestData;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletServiceJPATest {

    @Mock private WalletRepo walletRepo;

    @InjectMocks
    private WalletServiceJPA walletService;

    @Test
    void shouldRejectUnknownWallet() {
        when(walletRepo.findById(9L)).thenReturn(Optional.empty());
        WalletDTO dto = new WalletDTO(9L, 1L, "New", new BigDecimal("50.00"), "visa", "#000");

        assertThatThrownBy(() -> walletService.updateWallet(dto))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("Wallet with ID");
    }

    @Test
    void shouldReplaceInitialBalanceWhilePreservingEarnedBalance() {
        Wallet existing = TestData.wallet(7L, TestData.user(1L));
        existing.setInitialBalance(new BigDecimal("100.00"));
        existing.setBalance(new BigDecimal("250.00"));
        when(walletRepo.findById(7L)).thenReturn(Optional.of(existing));
        when(walletRepo.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WalletDTO dto = new WalletDTO(7L, 1L, "Renamed", new BigDecimal("80.00"), "mc", "#abc");

        Map<String, Object> result = walletService.updateWallet(dto);

        assertThat(result.get("success")).isEqualTo(true);
        ArgumentCaptor<Wallet> captor = ArgumentCaptor.forClass(Wallet.class);
        verify(walletRepo).save(captor.capture());
        Wallet saved = captor.getValue();
        // (250 - 100) + 80 = 230
        assertThat(saved.getBalance()).isEqualByComparingTo("230.00");
        assertThat(saved.getInitialBalance()).isEqualByComparingTo("80.00");
        assertThat(saved.getName()).isEqualTo("Renamed");
        assertThat(saved.getCardName()).isEqualTo("mc");
        assertThat(saved.getColor()).isEqualTo("#abc");
    }
}
