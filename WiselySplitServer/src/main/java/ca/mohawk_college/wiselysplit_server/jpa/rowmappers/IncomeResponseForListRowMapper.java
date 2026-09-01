package ca.mohawk_college.wiselysplit_server.jpa.rowmappers;

import ca.mohawk_college.wiselysplit_server.jpa.dtos.GroupResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.income.IncomeResponseForListDTO;
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

        UserResponseForListDTO userDTO = (income.getUser() != null)
                ? new UserResponseForListDTO(
                        income.getUser().getUserId(),
                        income.getUser().getName(),
                        income.getUser().getUserName(),
                        income.getUser().getProfilePicture())
                : null;


        WalletResponseForListDTO walletDTO = (income.getWallet() != null)
                ? new WalletResponseForListDTO(
                            income.getWallet().getWalletId(),
                            income.getWallet().getName(),
                            income.getWallet().getColor())
                : null;

        return new IncomeResponseForListDTO(
                income.getEntryId(),
                income.getTitle(),
                income.getAmount(),
                income.getDate(),
                income.getIncomeCategory(),
                userDTO,
                income.getEntryType(),
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
