package ca.mohawkCollege.wiselySplitServer.exceptions;

import ca.mohawkCollege.wiselySplitServer.jpa.constants.StatusCode;
import ca.mohawkCollege.wiselySplitServer.jpa.dtos.ResponseDTO;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * The single place where an exception becomes a response.
 *
 * <p>Controllers should not catch exceptions. A controller that wraps its body in
 * {@code try/catch (Exception e)} silently opts out of everything below, which is how the older
 * endpoints ended up reporting validation mistakes as server errors.
 *
 * <p>Handlers are split by who is at fault, because the two need opposite treatment:
 * <ul>
 *   <li><b>Expected outcomes</b> — a broken business rule, a bad request, a failed login. Logged
 *       at {@code WARN} on one line with no stack trace, because nothing is broken and a trace
 *       would only be noise. The caller gets a specific {@link StatusCode}.</li>
 *   <li><b>Unexpected faults</b> — anything that reaches the fallback. Logged at {@code ERROR}
 *       with the full stack trace under a generated {@code traceId}. The caller gets
 *       {@link StatusCode#INTERNAL_ERROR} plus that same id, and nothing else.</li>
 * </ul>
 *
 * <p>Nothing derived from an exception is ever placed in {@code statusDescription}. The only text
 * a caller receives is the vetted description on the {@link StatusCode}, so adding a handler can
 * never accidentally start leaking SQL, class names, or stack frames.
 *
 * <p>Every response leaves with HTTP 200; the outcome travels in {@code statusCode}. The mapping
 * in {@link StatusCode#getHttpStatus()} is logged rather than sent, so dashboards can still
 * classify traffic.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ------------------------------------------------------------------ expected outcomes

    /**
     * Covers {@link UserNotFoundException} and {@link DuplicateUserException} too, since both
     * extend {@link BusinessException}. New business rules need a {@link StatusCode}, not a new
     * exception subclass and not a new handler here.
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ResponseDTO> handleBusiness(BusinessException ex, HttpServletRequest request) {
        StatusCode status = ex.getStatus();
        log.warn("{} {} rejected as {} [{}]: {}",
                request.getMethod(), request.getRequestURI(), status.name(), status.getCode(), ex.getMessage());
        return ResponseDTO.respond(status, ex.getDetails());
    }

    /**
     * Bridge for services that still signal validation failures with {@code IllegalArgumentException}.
     * It keeps those endpoints out of the fallback while they are migrated; new code should throw
     * {@link BusinessException} with a precise code instead of relying on this.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ResponseDTO> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        log.warn("{} {} rejected as VALIDATION_ERROR (untyped): {}",
                request.getMethod(), request.getRequestURI(), ex.getMessage());
        return ResponseDTO.respond(StatusCode.VALIDATION_ERROR);
    }

    // ------------------------------------------------------------------ malformed requests

    /** Bean validation on an {@code @Valid} request body. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ResponseDTO> handleBeanValidation(MethodArgumentNotValidException ex,
                                                            HttpServletRequest request) {
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));

        log.warn("{} {} failed validation on {}", request.getMethod(), request.getRequestURI(), fields.keySet());
        return ResponseDTO.respond(StatusCode.VALIDATION_ERROR, Map.of("fields", fields));
    }

    /**
     * A path variable or query parameter that could not be bound, which is where an unrecognised
     * enum lands. The rejected value is deliberately not echoed back; only the parameter name and,
     * for enums, the fixed set of accepted values, both of which are ours rather than the caller's.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ResponseDTO> handleTypeMismatch(MethodArgumentTypeMismatchException ex,
                                                          HttpServletRequest request) {
        Class<?> required = ex.getRequiredType();
        boolean isEnum = required != null && required.isEnum();

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("parameter", ex.getName());
        if (isEnum) {
            details.put("accepted", Arrays.stream(required.getEnumConstants()).map(String::valueOf).toList());
        }

        log.warn("{} {} could not bind parameter '{}'", request.getMethod(), request.getRequestURI(), ex.getName());
        return ResponseDTO.respond(isEnum ? StatusCode.INVALID_ENUM_VALUE : StatusCode.INVALID_FIELD_FORMAT, details);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ResponseDTO> handleMissingParameter(MissingServletRequestParameterException ex,
                                                              HttpServletRequest request) {
        log.warn("{} {} missing parameter '{}'", request.getMethod(), request.getRequestURI(), ex.getParameterName());
        return ResponseDTO.respond(StatusCode.MISSING_REQUIRED_FIELD, Map.of("parameter", ex.getParameterName()));
    }

    /** Unparseable or absent request body. The parser message is withheld: it names our classes. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ResponseDTO> handleUnreadableBody(HttpMessageNotReadableException ex,
                                                            HttpServletRequest request) {
        log.warn("{} {} sent an unreadable body: {}",
                request.getMethod(), request.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return ResponseDTO.respond(StatusCode.MALFORMED_REQUEST);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ResponseDTO> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex,
                                                                HttpServletRequest request) {
        log.warn("{} not supported on {}", request.getMethod(), request.getRequestURI());
        return ResponseDTO.respond(StatusCode.UNSUPPORTED_OPERATION);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ResponseDTO> handleUploadTooLarge(MaxUploadSizeExceededException ex,
                                                            HttpServletRequest request) {
        log.warn("{} {} exceeded the upload size limit", request.getMethod(), request.getRequestURI());
        return ResponseDTO.respond(StatusCode.FILE_TOO_LARGE);
    }

    // ------------------------------------------------------------------ security

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ResponseDTO> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("{} {} denied: insufficient role", request.getMethod(), request.getRequestURI());
        return ResponseDTO.respond(StatusCode.ACCESS_DENIED);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ResponseDTO> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        // Deliberately vague: telling a caller which half was wrong enumerates accounts.
        log.warn("{} {} failed authentication", request.getMethod(), request.getRequestURI());
        return ResponseDTO.respond(StatusCode.INVALID_CREDENTIALS);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ResponseDTO> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        log.warn("{} {} authentication failed: {}",
                request.getMethod(), request.getRequestURI(), ex.getClass().getSimpleName());
        return ResponseDTO.respond(StatusCode.AUTHENTICATION_FAILED);
    }

    // ------------------------------------------------------------------ unexpected faults

    /**
     * A constraint the service layer should have checked before writing. Treated as a fault rather
     * than a business outcome, because reaching it means a pre-check is missing or two requests
     * raced.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ResponseDTO> handleDataIntegrity(DataIntegrityViolationException ex,
                                                           HttpServletRequest request) {
        String traceId = newTraceId();
        log.error("traceId={} {} {} violated a database constraint",
                traceId, request.getMethod(), request.getRequestURI(), ex);
        return ResponseEntity.ok(ResponseDTO.of(StatusCode.DATA_INTEGRITY_VIOLATION).withTraceId(traceId));
    }

    /**
     * Last resort. Anything arriving here is a bug or an outage, so it is logged in full and the
     * caller is told only that something failed, plus the id to quote when reporting it.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseDTO> handleUnexpected(Exception ex, HttpServletRequest request) {
        String traceId = newTraceId();
        log.error("traceId={} unhandled {} on {} {}",
                traceId, ex.getClass().getName(), request.getMethod(), request.getRequestURI(), ex);
        return ResponseEntity.ok(ResponseDTO.of(StatusCode.INTERNAL_ERROR).withTraceId(traceId));
    }

    private static String newTraceId() {
        return UUID.randomUUID().toString();
    }
}
