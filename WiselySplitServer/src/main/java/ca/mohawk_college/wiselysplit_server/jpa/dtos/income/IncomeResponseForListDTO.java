package ca.mohawk_college.wiselysplit_server.jpa.dtos.income;

import ca.mohawk_college.wiselysplit_server.jpa.constants.EntryType;
import ca.mohawk_college.wiselysplit_server.jpa.constants.IncomeCategory;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletResponseForListDTO;

import java.math.BigDecimal;
import java.time.LocalDate;

public record IncomeResponseForListDTO(
        Long entryId,
        String title,
        BigDecimal amount,
        LocalDate date,
        IncomeCategory category,
        UserResponseForListDTO user,
        EntryType entryType,
        WalletResponseForListDTO wallet
) {
}
