package ca.mohawkCollege.wiselySplitServer.jpa.dtos;

import java.math.BigDecimal;

//"participants": [
//                {
//                    "userId": {{receiver_id}},
//                    "name": "{{receiver_name}}",
//                    "amount": 50.00,
//                    "portion": 1,
//                    "include": true
//                }
//            ],
public record ExpenseParticipantRequestDTO(Long userId, BigDecimal amount, BigDecimal portion) {
}
