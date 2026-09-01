package ca.mohawk_college.wiselysplit_server.jpa.rowmappers;

import ca.mohawk_college.wiselysplit_server.jpa.dtos.expense.ExpenseResponseForListDTO;
import ca.mohawk_college.wiselysplit_server.jpa.entities.entry.Entry;

import java.util.List;

//TODO: Create a helper class that mapps Entries to their respective DTOs (expense, income or transfer)
public class EntryResponseMapper {
    public static List<ExpenseResponseForListDTO> toDtoList(List<Entry> entryList, Long userId) {
        return null;
    }
}
