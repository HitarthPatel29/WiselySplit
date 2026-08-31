package ca.mohawkCollege.wiselySplitServer.jpa.rowmappers;

import ca.mohawkCollege.wiselySplitServer.jpa.dtos.wallet.WalletWithExpensesResponseDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.Expense;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.Wallet;

import java.util.List;

public class WalletWithExpensesResponseRowMapper {
    public static WalletWithExpensesResponseDTO toDto(Wallet wallet, List<Expense> expenseList) {
        if (wallet == null) {
            return null;
        }

        return new WalletWithExpensesResponseDTO(
                wallet.getWalletId(),
                wallet.getName(),
                wallet.getInitialBalance(),
                wallet.getBalance(),
                wallet.getCardName(),
                wallet.getColor(),
                ExpenseResponseForListRowMapper.toDtoList(expenseList, wallet.getUser().getUserId())
        );
    }
}
