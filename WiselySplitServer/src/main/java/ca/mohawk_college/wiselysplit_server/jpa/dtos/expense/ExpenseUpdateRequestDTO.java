package ca.mohawk_college.wiselysplit_server.jpa.dtos.expense;

import ca.mohawk_college.wiselysplit_server.jpa.constants.EntryType;
import ca.mohawk_college.wiselysplit_server.jpa.constants.ExpenseCategory;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expenseparticipation.ExpenseParticipantRequestDTO;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

//{
//        "title": "Updated Test Expense",
//        "amount": 150.00,
//        "date": "{{settlement_date}}",
//        "type": "Travel",
//        "payerId": {{user_id}},
//        "shareWithId": {{receiver_id}},
//        "shareWith": "{{receiver_name}}",
//        "shareWithType": "friend",
//        "splitDetails": [
//            {
//            "userId": {{receiver_id}},
//            "name": "{{receiver_name}}",
//            "amount": 75.00,
//            "portion": 1,
//            "include": true
//            }
//        ],
//        "isSettleUp": false
//}
//      new Schema:
//{
//        "expenseId": 123
//        "title": "Updated Test Expense",
//        "amount": 150.00,
//        "date": "{{settlement_date}}",
//        "category": "other",
//        "payerId": {{user_id}},
//        "groupId": {{group_id}},
//        "isSettleUp": false,
//        "walletId": 11,
//        "toWalletId": null,
//        "paymentId": null,
//        "predictedCategory": "other"
//        "participants": [
//            {
//            "userId": {{receiver_id}},
//            "amount": 75.00,
//            "portion": 1,
//            }
//        ]
//}


public record ExpenseUpdateRequestDTO(
        @NotNull(message = "Expense cannot be updated without ExpenseID")
        Long expenseId,
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
        Boolean isPersonal,
        Long walletId,
        Long toWalletId,
        EntryType entryType,
        Long paymentId,
        List<ExpenseParticipantRequestDTO> participants,
        ExpenseCategory predictedCategory
) {}
