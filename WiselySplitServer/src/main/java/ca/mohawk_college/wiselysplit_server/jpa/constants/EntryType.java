package ca.mohawk_college.wiselysplit_server.jpa.constants;

public enum EntryType {
    EXPENSE,
    INCOME,
    TRANSFER,;

    public static final String DEFAULT = EXPENSE.name();
}
