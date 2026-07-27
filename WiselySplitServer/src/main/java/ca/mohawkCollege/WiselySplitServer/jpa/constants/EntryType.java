package ca.mohawkCollege.wiselySplitServer.jpa.constants;

public enum EntryType {
    expense,
    income,
    transfer;

    public static final String DEFAULT = expense.name();
}
