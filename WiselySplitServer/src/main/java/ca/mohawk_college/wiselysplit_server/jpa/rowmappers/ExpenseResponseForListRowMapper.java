package ca.mohawk_college.wiselysplit_server.jpa.rowmappers;

import ca.mohawk_college.wiselysplit_server.jpa.dtos.GroupResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expense.ExpenseResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Expense;
import ca.mohawk_college.wiselysplit_server.jpa.entities.ExpenseParticipation;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

public class ExpenseResponseForListRowMapper {
    public static ExpenseResponseForListDTO toDto(Expense expense, Long userId) {
        if (expense == null) {
            return null;
        }
        BigDecimal amountLentOrOwed = (!expense.getIsPersonal() && !expense.getIsSettleUp())
                ? computeAmountLentOrOwedByCurrentUser(expense, userId)
                : null;

        UserResponseForListDTO payerDTO = (expense.getPayer() != null)
                ? new UserResponseForListDTO(
                        expense.getPayer().getUserId(),
                        expense.getPayer().getName(),
                        expense.getPayer().getUserName(),
                        expense.getPayer().getProfilePicture())
                : null;

        GroupResponseForListDTO groupDTO = (expense.getExpenseGroup() != null)
                ? new GroupResponseForListDTO(
                        expense.getExpenseGroup().getGroupId(),
                        expense.getExpenseGroup().getGroupName(),
                        expense.getExpenseGroup().getGroupType(),
                        expense.getExpenseGroup().getProfilePicture(),
                        null)
                : null;

        WalletResponseForListDTO walletDTO = (expense.getWallet() != null)
                ? new WalletResponseForListDTO(
                            expense.getWallet().getWalletId(),
                            expense.getWallet().getName(),
                            expense.getWallet().getColor())
                : null;

        return new ExpenseResponseForListDTO(
                expense.getEntryId(),
                expense.getTitle(),
                expense.getAmount(),
                amountLentOrOwed,
                expense.getDate(),
                expense.getExpenseCategory(),
                payerDTO,
                groupDTO,
                expense.getIsSettleUp(),
                expense.getIsPersonal(),
                expense.getEntryType(),
                walletDTO
        );
    }

    /**
     * Checks if the User is Payer in the Expense.
     * Gets the user's contribution in the Expense.
     * If user is payer -> Total expense amount - user's contribution (positive value).
     * Else -> user's contribution (Negative value)
     * @param expense
     * @param userId
     * @return
     */
    public static BigDecimal computeAmountLentOrOwedByCurrentUser(Expense expense, Long userId){

        boolean isUserThePayer = expense.getPayer().getUserId().equals(userId);
        BigDecimal userContributionInExpense = expense.getParticipants().stream()
                .filter(
                        participant -> participant.getUser().getUserId().equals(userId)
                ).map(ExpenseParticipation::getContribution)
                .reduce(BigDecimal::add)
                .orElse(BigDecimal.ZERO);

        return (isUserThePayer)
                ? expense.getAmount().subtract(userContributionInExpense)   //amountLent -> Positive value
                : userContributionInExpense.negate();                       //amountOwed -> Negative value
    }

    /**
     * Maps Expenses to ExpenseResponseForListDTO
     * @param expenses  -> Expense to be mapped
     * @param userId    -> To calculate the AmountLentOrOwed (Amount will be calculated in POV of the User)
     * @return list of ExpenseResponseForListDTO
     */
    public static List<ExpenseResponseForListDTO> toDtoList(List<Expense> expenses, Long userId) {
        return expenses.stream()
                .map(expense -> toDto(expense,userId))
                .collect(Collectors.toList());
    }
}
