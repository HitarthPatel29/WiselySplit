package ca.mohawk_college.wiselysplit_server.jpa.dtos.entry;

import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list.ExpenseResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list.IncomeResponseForListDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class PersonalSummaryResponseDTO {
    BigDecimal netStanding;
    BigDecimal totalIncome;
    BigDecimal totalExpense;
    BigDecimal totalAmountLent;
    BigDecimal totalAmountOwed;
    List<ExpenseResponseForListDTO> expenses;
    List<IncomeResponseForListDTO> incomes;

}
