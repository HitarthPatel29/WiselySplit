package ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet;

import ca.mohawk_college.wiselysplit_server.jpa.constants.WalletColor;

import java.math.BigDecimal;

public record WalletResponseDTO(
        Long walletId,
        String name,
        String cardName,
        BigDecimal initialBalance,
        BigDecimal balance,
        WalletColor color
) {}