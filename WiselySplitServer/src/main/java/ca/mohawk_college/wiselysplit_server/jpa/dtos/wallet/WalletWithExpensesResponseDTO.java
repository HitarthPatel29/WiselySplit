package ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet;

import ca.mohawk_college.wiselysplit_server.jpa.dtos.expense.ExpenseResponseForListDTO;
import java.math.BigDecimal;
import java.util.List;

public record WalletWithExpensesResponseDTO (
    Long walletId,
    String name,
    BigDecimal initialBalance,
    BigDecimal balance,
    String cardName,
    String color,
    List<ExpenseResponseForListDTO> expenses
){}
