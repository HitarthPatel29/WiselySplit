package ca.mohawk_college.wiselysplit_server.jpa.constants;

public enum PaymentStatus {
    CREATED, PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED;
    public static final String DEFAULT = CREATED.name();
}
