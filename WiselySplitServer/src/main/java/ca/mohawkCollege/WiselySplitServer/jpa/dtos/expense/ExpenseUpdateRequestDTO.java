package ca.mohawkCollege.wiselySplitServer.jpa.dtos.expense;

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
public record ExpenseUpdateRequestDTO(

) {}
