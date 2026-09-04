package ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet;

import ca.mohawk_college.wiselysplit_server.jpa.constants.WalletColor;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list.EntryResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list.ExpenseResponseForListDTO;
import java.math.BigDecimal;
import java.util.List;

public record WalletWithExpensesResponseDTO (
    Long walletId,
    String name,
    BigDecimal initialBalance,
    BigDecimal balance,
    String cardName,
    WalletColor color,
    List<EntryResponseForListDTO> entries
){}
