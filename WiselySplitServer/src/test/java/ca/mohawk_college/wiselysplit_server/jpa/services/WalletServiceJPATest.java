package ca.mohawk_college.wiselysplit_server.jpa.services;

import ca.mohawk_college.wiselysplit_server.exceptions.BusinessException;
import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;
import ca.mohawk_college.wiselysplit_server.jpa.constants.WalletColor;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletUpdateRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.User;
import ca.mohawk_college.wiselysplit_server.jpa.entities.Wallet;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.UserRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.WalletRepo;
import ca.mohawk_college.wiselysplit_server.jpa.repositories.entry.EntryRepo;
import ca.mohawk_college.wiselysplit_server.jpa.support.SecurityTestSupport;
import ca.mohawk_college.wiselysplit_server.jpa.support.TestData;
import ca.mohawk_college.wiselysplit_server.utilities.auth.AuthorizationService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class WalletServiceJPATest {

    @Mock private WalletRepo walletRepo;
    @Mock private EntryRepo entryRepo;
    @Mock private UserRepo userRepo;
    @Mock private AuthorizationService authzService;

    @InjectMocks
    private WalletServiceJPA walletService;
    private MockMvc mvc;

    private final User alice = TestData.user(1L, "Alice");

    @Nested
    class GetExpensesGroupedByWallet {
        @Test
        void shouldGroupByWalletsUsingPrincipal() throws Exception {
            SecurityTestSupport.asUser(7L);
            when(walletService.getExpensesGroupedByWallet(7L)).thenReturn(List.of());

            mvc.perform(get("/api/jpa/me/wallets/with-expenses"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(StatusCode.SUCCESS.getCode()));
            verify(walletService).getExpensesGroupedByWallet(7L);
        }

        @Test
        void shouldRejectUnknownUser() {
            when(userRepo.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> walletService.getExpensesGroupedByWallet(1L))
                    .isInstanceOf(BusinessException.class)
                    .extracting(ex -> ((BusinessException) ex).getStatus())
                    .isEqualTo(StatusCode.USER_NOT_FOUND);
            verify(authzService).requireSelf(1L);
        }

        @Test
        void shouldRejectNullWallets() {
            alice.setWallets(null);
            when(userRepo.findById(1L)).thenReturn(Optional.of(alice));

            assertThatThrownBy(() -> walletService.getExpensesGroupedByWallet(1L))
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

            assertThat(walletService.getExpensesGroupedByWallet(1L)).hasSize(1);
            verify(entryRepo).findAllByWallet(11L);
        }
    }

    @Test
    void shouldRejectUnknownWallet() {
        when(walletRepo.findById(9L)).thenReturn(Optional.empty());
        WalletUpdateRequestDTO dto = new WalletUpdateRequestDTO(
                9L, "New", new BigDecimal("50.00"), "visa", WalletColor.BLACK);

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

        WalletUpdateRequestDTO dto = new WalletUpdateRequestDTO(
                7L, "Renamed", new BigDecimal("80.00"), "mc", WalletColor.SLATE);

        assertThatNoException().isThrownBy(() -> walletService.updateWallet(dto));

        ArgumentCaptor<Wallet> captor = ArgumentCaptor.forClass(Wallet.class);
        verify(walletRepo).save(captor.capture());
        Wallet saved = captor.getValue();
        // (250 - 100) + 80 = 230
        assertThat(saved.getBalance()).isEqualByComparingTo("230.00");
        assertThat(saved.getInitialBalance()).isEqualByComparingTo("80.00");
        assertThat(saved.getName()).isEqualTo("Renamed");
        assertThat(saved.getCardName()).isEqualTo("mc");
        assertThat(saved.getColor()).isEqualTo(WalletColor.SLATE);
    }
}
