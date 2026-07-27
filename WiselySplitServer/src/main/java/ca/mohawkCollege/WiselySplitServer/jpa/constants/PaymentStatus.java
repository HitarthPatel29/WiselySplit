package ca.mohawkCollege.wiselySplitServer.jpa.constants;

public enum PaymentStatus {
    CREATED, PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED;
    public static final String DEFAULT = CREATED.name();
}
