package ca.mohawkCollege.wiselySplitServer.jpa.dtos.expense;

import ca.mohawkCollege.wiselySplitServer.jpa.constants.EntryType;
import ca.mohawkCollege.wiselySplitServer.jpa.constants.ExpenseCategory;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

//  New API Schema
//        "title": "Test Expense",
//        "amount": 100.00,
//        "date": "{{settlement_date}}",
//        "category": "Food & Dining",
//        "payerId": {{user_id}},
//        "entryType": "expense"
//        "walletId": 11,
//        "predictedCategory": "Food & Dining"

public record PersonalExpenseRequestDTO(
        String title,
        @NotNull(message = "amount cannot be null")
        @PositiveOrZero(message = "amount cannot be negative")
        BigDecimal amount,
        @NotNull(message = "date cannot be null")
        LocalDate date,
        ExpenseCategory category,
        @NotNull(message = "Personal expense submitted without a payer")
        Long payerId,
        EntryType entryType,
        Long walletId,
        ExpenseCategory predictedCategory
)
{}
