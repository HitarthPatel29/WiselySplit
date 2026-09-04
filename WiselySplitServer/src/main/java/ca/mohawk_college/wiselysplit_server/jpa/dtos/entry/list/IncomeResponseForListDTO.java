package ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list;

import ca.mohawk_college.wiselysplit_server.jpa.constants.EntryType;
import ca.mohawk_college.wiselysplit_server.jpa.constants.IncomeCategory;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletResponseForListDTO;

import java.math.BigDecimal;
import java.time.LocalDate;

public record IncomeResponseForListDTO(
        Long id,
        BigDecimal amount,
        String title,
        LocalDate date,
        EntryType entryType,
        IncomeCategory category,
        WalletResponseForListDTO wallet
) implements EntryResponseForListDTO {
}
