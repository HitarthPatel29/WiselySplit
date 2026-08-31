package ca.mohawk_college.wiselysplit_server.exceptions;

import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;

/**
 * A failure the caller can understand and act on: a broken business rule, a missing resource,
 * a rejected request. Carries the {@link StatusCode} that
 * {@link GlobalExceptionHandler} returns, so the decision of "what does the caller see" is made
 * once, at the place that detected the problem, instead of being re-derived in every controller.
 *
 * <p>The two payloads it carries are aimed at different audiences and must not be confused:
 * <ul>
 *   <li>{@link #getMessage()} is for the log. Put whatever helps you debug in it — ids, offending
 *       values, context. It is never sent to the caller.</li>
 *   <li>{@link #getStatus()} is for the caller. Its description is vetted, user-safe text.</li>
 * </ul>
 *
 * <p>Throw this for expected outcomes only. A dropped database connection or a null-pointer bug is
 * not a {@code BusinessException} — let those propagate untouched so the handler can log them as
 * genuine faults and hand back {@link StatusCode#INTERNAL_ERROR}.
 *
 * <pre>{@code
 * if (participants.isEmpty()) {
 *     throw new BusinessException(StatusCode.PARTICIPANTS_REQUIRED,
 *             "Expense " + title + " submitted by payer " + payerId + " had no participants");
 * }
 * }</pre>
 */
public class BusinessException extends RuntimeException {

    private final StatusCode status;

    /** Optional caller-safe payload, surfaced as {@code data} in the response envelope. */
    private transient Object details;

    public BusinessException(StatusCode status) {
        this(status, status.getDescription(), null);
    }

    public BusinessException(StatusCode status, String diagnosticMessage) {
        this(status, diagnosticMessage, null);
    }

    public BusinessException(StatusCode status, String diagnosticMessage, Throwable cause) {
        super(diagnosticMessage, cause);
        this.status = status;
    }

    /**
     * Attaches structured, caller-safe context such as which fields failed validation. Never put
     * exception text or anything derived from internals here; it is returned to the caller.
     */
    public BusinessException withDetails(Object details) {
        this.details = details;
        return this;
    }

    public StatusCode getStatus() {
        return status;
    }

    public Object getDetails() {
        return details;
    }
}
