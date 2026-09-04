package ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list;

import ca.mohawk_college.wiselysplit_server.jpa.constants.EntryType;
import ca.mohawk_college.wiselysplit_server.jpa.constants.ExpenseCategory;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.GroupResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletResponseForListDTO;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseResponseForListDTO(
    Long id,
    String title,
    BigDecimal amount,
    BigDecimal amountLentOrOwed,
    LocalDate date,
    ExpenseCategory category,
    UserResponseForListDTO payer,
    GroupResponseForListDTO expenseGroup,
    Boolean isSettleUp,
    Boolean isPersonal,
    EntryType entryType,
    WalletResponseForListDTO wallet
) implements EntryResponseForListDTO {}
