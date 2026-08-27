package ca.mohawkCollege.wiselySplitServer.jpa.dtos.wallet;

import ca.mohawkCollege.wiselySplitServer.jpa.dtos.expense.ExpenseForListResponseDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.User;

import java.math.BigDecimal;
import java.util.List;

public record walletListWithExpensesResponseDTO (

     Long walletId,
    
     User user,
    
     String name,
    
     BigDecimal initialBalance,
    
     BigDecimal balance,
    
     String cardName,
    
     String color,
     List<ExpenseForListResponseDTO> expenses
){}
