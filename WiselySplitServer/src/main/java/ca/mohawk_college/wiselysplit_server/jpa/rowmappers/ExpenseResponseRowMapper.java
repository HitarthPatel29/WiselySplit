package ca.mohawk_college.wiselysplit_server.jpa.rowmappers;

import ca.mohawk_college.wiselysplit_server.jpa.dtos.GroupResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expense.ExpenseResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expenseparticipation.ExpenseParticipantResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Expense;

import java.util.List;
import java.util.stream.Collectors;

public class ExpenseResponseRowMapper {

    public static ExpenseResponseDTO toDto(Expense expense) {
        if (expense == null) return null;

        ExpenseResponseDTO responseDTO = new ExpenseResponseDTO();
        responseDTO.setExpenseId(expense.getEntryId());
        responseDTO.setAmount(expense.getAmount());
        responseDTO.setTitle(expense.getTitle());
        responseDTO.setDate(expense.getDate());
        responseDTO.setCategory(expense.getExpenseCategory());
        responseDTO.setIsSettleUp(expense.getIsSettleUp());
        responseDTO.setIsPersonal(expense.getIsPersonal());
        responseDTO.setEntryType(expense.getEntryType());

        responseDTO.setPayer(
                ( null != expense.getPayer() )
                        ? new UserResponseForListDTO(
                                expense.getPayer().getUserId(),
                                expense.getPayer().getName(),
                                expense.getPayer().getUserName(),
                                expense.getPayer().getProfilePicture())
                        : null
        );

        responseDTO.setExpenseGroup(
                (null != expense.getExpenseGroup())
                        ? new GroupResponseForListDTO(
                                expense.getExpenseGroup().getGroupId(),
                                expense.getExpenseGroup().getGroupName(),
                                expense.getExpenseGroup().getGroupType(),
                                expense.getExpenseGroup().getProfilePicture(),
                                null)
                        : null
        );

        responseDTO.setWallet(
                (null != expense.getWallet())
                        ? new WalletResponseForListDTO(
                                expense.getWallet().getWalletId(),
                                expense.getWallet().getName(),
                                expense.getWallet().getColor())
                        : null
        );

        responseDTO.setPaymentId(
                null != expense.getPayment() ? expense.getPayment().getPaymentId() : null
        );

        responseDTO.setParticipants(
                (!expense.getIsPersonal())
                        ? expense.getParticipants().stream()
                            .map(participant ->
                                new ExpenseParticipantResponseDTO(
                                        UserResponseForListRowMapper.toDto(participant.getUser()),
                                        participant.getContribution(),
                                        participant.getContributionPortion()
                                ))
                            .collect(Collectors.toList())
                        : null
        );

        return responseDTO;
    }

    public static List<ExpenseResponseDTO> toDtoList(List<Expense> expenses) {
        return expenses.stream()
                .map(ExpenseResponseRowMapper::toDto)
                .collect(Collectors.toList());
    }
}
