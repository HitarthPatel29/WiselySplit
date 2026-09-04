package ca.mohawk_college.wiselysplit_server.jpa.rowmappers;

import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list.IncomeResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.user.UserResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.wallet.WalletResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Income;


import java.util.List;
import java.util.stream.Collectors;

public class IncomeResponseForListRowMapper {
    public static IncomeResponseForListDTO toDto(Income income) {
        if (income == null) {
            return null;
        }

        WalletResponseForListDTO walletDTO = (income.getWallet() != null)
                ? new WalletResponseForListDTO(
                            income.getWallet().getWalletId(),
                            income.getWallet().getName(),
                            income.getWallet().getColor())
                : null;

        return new IncomeResponseForListDTO(
                income.getEntryId(),
                income.getAmount(),
                income.getTitle(),
                income.getDate(),
                income.getEntryType(),
                income.getIncomeCategory(),
                walletDTO
        );
    }

    /**
     * Maps Incomes to IncomeResponseForListDTO
     * @param incomes  -> Income to be mapped
     * @return list of IncomeResponseForListDTO
     */
    public static List<IncomeResponseForListDTO> toDtoList(List<Income> incomes) {
        return incomes.stream()
                .map(income -> toDto(income))
                .collect(Collectors.toList());
    }
}
