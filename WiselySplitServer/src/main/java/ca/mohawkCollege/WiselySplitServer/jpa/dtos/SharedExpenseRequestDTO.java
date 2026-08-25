package ca.mohawkCollege.wiselySplitServer.jpa.dtos;

import ca.mohawkCollege.wiselySplitServer.jpa.constants.ExpenseCategory;

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
    BigDecimal amount,
    LocalDate date,
    ExpenseCategory category,
    Long payerId,
    Long groupId,
    Boolean isSettleUp,
    Long walletId,
    Long paymentId,
    List<ExpenseParticipantRequestDTO> participants,
    ExpenseCategory predictedCategory
){}
