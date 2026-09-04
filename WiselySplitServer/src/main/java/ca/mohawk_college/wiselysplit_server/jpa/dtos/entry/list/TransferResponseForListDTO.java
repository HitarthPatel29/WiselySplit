package ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list;

import ca.mohawk_college.wiselysplit_server.jpa.constants.EntryType;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletResponseForListDTO;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransferResponseForListDTO(
        Long id,
        BigDecimal amount,
        String title,
        LocalDate date,
        EntryType entryType,
        WalletResponseForListDTO fromWallet,
        WalletResponseForListDTO toWallet
) implements EntryResponseForListDTO {
}
