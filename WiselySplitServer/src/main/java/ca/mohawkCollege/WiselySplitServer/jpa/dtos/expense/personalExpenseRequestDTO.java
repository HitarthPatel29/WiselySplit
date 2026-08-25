package ca.mohawkCollege.wiselySplitServer.jpa.dtos.expense;

import ca.mohawkCollege.wiselySplitServer.jpa.constants.EntryType;
import ca.mohawkCollege.wiselySplitServer.jpa.constants.ExpenseCategory;

import java.math.BigDecimal;
import java.time.LocalDate;

public record personalExpenseRequestDTO(
        String title,
        BigDecimal amount,
        LocalDate date,
        ExpenseCategory category,
        Long payerId,
        Boolean isPersonal,
        EntryType entryType,
        Long walletId,
        ExpenseCategory predictedCategory
)
{}
