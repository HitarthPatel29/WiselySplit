package ca.mohawk_college.wiselysplit_server.jpa.dtos;

import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.expense.ExpenseResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.expense.SharedExpenseRequestDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list.ExpenseResponseForListDTO;

import java.math.BigDecimal;
import java.util.List;

public record FriendResponseDTO (
        Long UserId,
        String name,
        String userName,
        String profilePicture,
        BigDecimal amountOwedOrLentToUser,
        List<ExpenseResponseForListDTO> expenses){
}
