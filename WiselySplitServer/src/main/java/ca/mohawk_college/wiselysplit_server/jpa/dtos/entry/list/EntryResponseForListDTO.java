package ca.mohawk_college.wiselysplit_server.jpa.dtos.entry.list;

import ca.mohawk_college.wiselysplit_server.jpa.constants.EntryType;

import java.math.BigDecimal;
import java.time.LocalDate;

public sealed interface EntryResponseForListDTO
        permits ExpenseResponseForListDTO, IncomeResponseForListDTO, TransferResponseForListDTO {

    Long id();
    BigDecimal amount();
    String title();
    LocalDate date();
    EntryType entryType();
}