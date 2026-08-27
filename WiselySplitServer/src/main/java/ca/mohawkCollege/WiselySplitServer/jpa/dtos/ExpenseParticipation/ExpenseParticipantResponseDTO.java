package ca.mohawkCollege.wiselySplitServer.jpa.dtos.expenseparticipation;

import ca.mohawkCollege.wiselySplitServer.jpa.dtos.user.UserResponseForListDTO;

import java.math.BigDecimal;
//"participants": [
//                {
//                    "userId": {{receiver_id}},
//                    "name": "{{receiver_name}}",
//                    userName,
//                    profilePicture,
//                    "amount": 50.00,
//                    "portion": 1,
//                    "include": true
//                }
//            ],
public record ExpenseParticipantResponseDTO (UserResponseForListDTO user, BigDecimal amount, BigDecimal portion){
}
