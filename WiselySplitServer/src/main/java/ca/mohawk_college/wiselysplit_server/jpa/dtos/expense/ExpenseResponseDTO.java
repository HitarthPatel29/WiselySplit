package ca.mohawk_college.wiselysplit_server.jpa.dtos.expense;

import ca.mohawk_college.wiselysplit_server.jpa.constants.EntryType;
import ca.mohawk_college.wiselysplit_server.jpa.constants.ExpenseCategory;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.expenseparticipation.ExpenseParticipantResponseDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.GroupResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletResponseForListDTO;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@Component
public class ExpenseResponseDTO {
        Long expenseId;
        String title;
        @NotNull(message = "amount cannot be null")
        @PositiveOrZero(message = "amount cannot be negative")
        BigDecimal amount;
        @NotNull(message = "date cannot be null")
        LocalDate date;
        ExpenseCategory category;
        @NotNull(message = "Expense extracted without a payer")
        UserResponseForListDTO payer;
        GroupResponseForListDTO expenseGroup;
        Boolean isSettleUp;
        Boolean isPersonal;
        WalletResponseForListDTO wallet;
        WalletResponseForListDTO toWallet;
        EntryType entryType;
        Long paymentId;
        List<ExpenseParticipantResponseDTO> participants;
}
