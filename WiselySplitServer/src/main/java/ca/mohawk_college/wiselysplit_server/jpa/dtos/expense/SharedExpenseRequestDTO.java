package ca.mohawk_college.wiselysplit_server.jpa.dtos.expense;

import ca.mohawk_college.wiselysplit_server.jpa.constants.ExpenseCategory;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expenseparticipation.ExpenseParticipantRequestDTO;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

//  New API Schema
//        "title": "Test Expense",
//        "amount": 100.00,
//        "date": "{{settlement_date}}",
//        "category": "Food & Dining",
//        "payerId": {{user_id}},
//        "groupId": null,
//        "participants": [
//            {
//                "userId": {{receiver_id}},
//                "amount": -50.00,
//                "portion": 1
//            }...
//        ],
//        "isSettleUp": false,
//        "walletId": 11,
//        "predictedCategory": "Food & Dining"
public record SharedExpenseRequestDTO (
    String title,
    @NotNull(message = "amount cannot be null")
    @PositiveOrZero(message = "amount cannot be negative")
    BigDecimal amount,
    @NotNull(message = "date cannot be null")
    LocalDate date,
    ExpenseCategory category,
    @NotNull(message = "Personal expense submitted without a payer")
    Long payerId,
    Long groupId,
    Boolean isSettleUp,
    Long walletId,
    Long paymentId,
    @NotEmpty(message = "Shared expense invalid with no participants")
    List<ExpenseParticipantRequestDTO> participants,
    ExpenseCategory predictedCategory
){}
