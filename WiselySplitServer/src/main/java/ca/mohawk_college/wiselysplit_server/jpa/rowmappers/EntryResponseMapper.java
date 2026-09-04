package ca.mohawk_college.wiselysplit_server.jpa.rowmappers;

import ca.mohawk_college.wiselysplit_server.jpa.constants.EntryType;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list.EntryResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list.ExpenseResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list.IncomeResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Entry;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Expense;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Income;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Transfer;

import java.util.List;
import java.util.stream.Collectors;

/**
 * a helper class that mapps Entries to their respective DTOs (expense, income or transfer)
 */
public class EntryResponseMapper {
    public static EntryResponseForListDTO toDto(Entry entry, Long userId) {
        if (entry instanceof Expense expense) {
             return ExpenseResponseForListRowMapper.toDto(expense,  userId);
        } else if (entry instanceof Income income) {
            return IncomeResponseForListRowMapper.toDto(income);
        } else if (entry instanceof Transfer transfer) {
            return TransferResponseForListRowMapper.toDto(transfer);
        } else throw new IllegalArgumentException("Invalid entry type");
    }
    public static List<EntryResponseForListDTO> toDtoList(List<Entry> entryList, Long userId) {

        return entryList.stream()
                .map(entry -> EntryResponseMapper.toDto(entry,  userId))
                .collect(Collectors.toList());
    }
}
