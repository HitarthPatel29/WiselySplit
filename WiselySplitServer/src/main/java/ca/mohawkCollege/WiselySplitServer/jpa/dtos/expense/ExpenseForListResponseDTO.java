package ca.mohawkCollege.wiselySplitServer.jpa.dtos.expense;

import ca.mohawkCollege.wiselySplitServer.jpa.constants.EntryType;
import ca.mohawkCollege.wiselySplitServer.jpa.constants.ExpenseCategory;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.GroupResponseForListDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.expenseparticipation.ExpenseParticipantResponseDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.user.UserResponseForListDTO;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.wallet.WalletResponseForListDTO;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ExpenseForListResponseDTO(
    Long expenseId,
    String title,
    @NotNull(message = "amount cannot be null")
    @PositiveOrZero(message = "amount cannot be negative")
    BigDecimal amount,
    @NotNull(message = "date cannot be null")
    LocalDate date,
    ExpenseCategory category,
    @NotNull(message = "Expense extracted without a payer")
    UserResponseForListDTO payer,
    GroupResponseForListDTO expenseGroup,
    Boolean isSettleUp,
    Boolean isPersonal,
    WalletResponseForListDTO wallet,
    WalletResponseForListDTO toWalletId,
    EntryType entryType,
    Long paymentId,
    List<ExpenseParticipantResponseDTO> participants
){}
