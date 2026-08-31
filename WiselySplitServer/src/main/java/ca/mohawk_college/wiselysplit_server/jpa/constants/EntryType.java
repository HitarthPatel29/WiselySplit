package ca.mohawk_college.wiselysplit_server.jpa.constants;

public enum EntryType {
    expense,
    income,
    transfer;

    public static final String DEFAULT = expense.name();
}
