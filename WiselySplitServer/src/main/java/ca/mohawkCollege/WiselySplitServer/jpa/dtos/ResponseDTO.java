package ca.mohawkCollege.wiselySplitServer.jpa.dtos;

import ca.mohawkCollege.wiselySplitServer.jpa.constants.StatusCode;
import lombok.Builder;
import lombok.Data;
import org.springframework.http.ResponseEntity;

/**
 * Standard response envelope for the JPA endpoints.
 *
 * <p>Build it through {@link #of} or {@link #respond} rather than the raw builder, so
 * {@code statusCode} and {@code statusDescription} can only ever come from {@link StatusCode}.
 * That keeps exception text out of the description field, which is caller-visible.
 */
@Builder
@Data
public class ResponseDTO {
    private Object data;
    private String statusCode;
    private String statusDescription;

    /**
     * Correlation id for an unexpected server fault, matching the id on the logged stack trace.
     * Null on success and on business rejections, which need no investigation. It exists so a user
     * can quote something actionable to support without the server having to leak internals.
     */
    private String traceId;

    /** Stamps the id that the matching log entry was written under. */
    public ResponseDTO withTraceId(String traceId) {
        this.traceId = traceId;
        return this;
    }

    public static ResponseDTO of(StatusCode status, Object data) {
        return ResponseDTO.builder()
                .data(data)
                .statusCode(status.getCode())
                .statusDescription(status.getDescription())
                .build();
    }

    public static ResponseDTO of(StatusCode status) {
        return of(status, null);
    }

    /**
     * Envelope ready to return from a controller. The HTTP status is always {@code 200}: the
     * transport succeeded and the business outcome travels in {@code statusCode}. An endpoint that
     * genuinely needs a different transport status should build its own {@code ResponseEntity}
     * around {@link #of} instead.
     */
    public static ResponseEntity<ResponseDTO> respond(StatusCode status, Object data) {
        return ResponseEntity.ok(of(status, data));
    }

    public static ResponseEntity<ResponseDTO> respond(StatusCode status) {
        return respond(status, null);
    }
}
