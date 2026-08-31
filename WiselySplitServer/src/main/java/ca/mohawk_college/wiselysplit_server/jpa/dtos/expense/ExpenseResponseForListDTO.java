package ca.mohawk_college.wiselysplit_server.jpa.dtos.expense;

import ca.mohawk_college.wiselysplit_server.jpa.constants.EntryType;
import ca.mohawk_college.wiselysplit_server.jpa.constants.ExpenseCategory;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.GroupResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletResponseForListDTO;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseResponseForListDTO(
        Long expenseId,
        String title,
        @NotNull(message = "amount cannot be null")
    @PositiveOrZero(message = "amount cannot be negative")
    BigDecimal amount,
        BigDecimal amountLentOrOwed,
        @NotNull(message = "date cannot be null")
    LocalDate date,
        ExpenseCategory category,
        @NotNull(message = "Expense extracted without a payer")
    UserResponseForListDTO payer,
        GroupResponseForListDTO expenseGroup,
        Boolean isSettleUp,
        Boolean isPersonal,
        EntryType entryType,
        WalletResponseForListDTO wallet,
        WalletResponseForListDTO toWalletId
){}
