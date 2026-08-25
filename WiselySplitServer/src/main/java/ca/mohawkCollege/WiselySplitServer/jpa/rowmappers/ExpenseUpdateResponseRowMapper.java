package ca.mohawkCollege.wiselySplitServer.jpa.rowmappers;

import ca.mohawkCollege.wiselySplitServer.jpa.dtos.GroupResponseForListDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.expense.ExpenseUpdateResponseDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.user.UserResponseForListDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.wallet.WalletResponseForListDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.entities.Expense;

import java.util.List;
import java.util.stream.Collectors;

public class ExpenseUpdateResponseRowMapper{

    public static ExpenseUpdateResponseDTO toDto(Expense expense) {
        if (expense == null) {
            return null;
        }

        ExpenseUpdateResponseDTO responseDTO = new ExpenseUpdateResponseDTO();
        responseDTO.setExpenseId(expense.getExpenseId());
        responseDTO.setAmount(expense.getAmount());
        responseDTO.setTitle(expense.getExpenseTitle());
        responseDTO.setDate(expense.getExpenseDate());
        responseDTO.setCategory(expense.getExpenseCategory());
        responseDTO.setIsSettleUp(expense.getIsSettleUp());
        responseDTO.setIsPersonal(expense.getIsPersonal());
        responseDTO.setEntryType(expense.getEntryType());

        if (expense.getPayer() != null) {
            responseDTO.setPayer(
                    new UserResponseForListDTO(
                            expense.getPayer().getUserId(),
                            expense.getPayer().getName(),
                            expense.getPayer().getUserName(),
                            expense.getPayer().getProfilePicture()
                    )
            );
        }
        if (expense.getExpenseGroup() != null) {
            responseDTO.setExpenseGroup(
                    new GroupResponseForListDTO(
                            expense.getExpenseGroup().getGroupId(),
                            expense.getExpenseGroup().getGroupName(),
                            expense.getExpenseGroup().getGroupType(),
                            expense.getExpenseGroup().getProfilePicture(),
                            null
                    )
            );
        }

        if (expense.getPayment() != null) {
            responseDTO.setPaymentId(expense.getPayment().getPaymentId());
        }

        if (expense.getWallet() != null) {
            responseDTO.setWallet(
                    new WalletResponseForListDTO(
                            expense.getWallet().getWalletId(),
                            expense.getWallet().getName(),
                            expense.getWallet().getColor()
                    )
            );
        }

        if (expense.getToWallet() != null) {
            responseDTO.setToWalletId(
                    new WalletResponseForListDTO(
                            expense.getToWallet().getWalletId(),
                            expense.getToWallet().getName(),
                            expense.getToWallet().getColor()
            ));
        }

        return responseDTO;
    }

    public static List<ExpenseUpdateResponseDTO> toDtoList(List<Expense> expenses) {
        return expenses.stream()
                .map(ExpenseUpdateResponseRowMapper::toDto)
                .collect(Collectors.toList());
    }
}
