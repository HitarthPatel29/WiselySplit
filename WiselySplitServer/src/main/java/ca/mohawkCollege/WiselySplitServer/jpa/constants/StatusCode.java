package ca.mohawkCollege.wiselySplitServer.jpa.constants;

import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Canonical business status codes returned in
 * {@link ca.mohawkCollege.wiselySplitServer.jpa.dtos.ResponseDTO#getStatusCode()}.
 *
 * <p>Codes are grouped by domain so a code can be routed to an owning team by prefix alone:
 * <pre>
 *   00xx  Success
 *   01xx  Request validation
 *   02xx  Authentication and authorization
 *   03xx  User and account
 *   04xx  Wallet
 *   05xx  Expense
 *   06xx  Income and transfer
 *   07xx  Group
 *   08xx  Invite and friends
 *   09xx  Payment and Stripe
 *   10xx  Classification and model
 *   11xx  Notification and email
 *   90xx  System and infrastructure
 * </pre>
 *
 * <p>Every description is safe to display to an end user: no exception messages, stack traces,
 * SQL, table names, or third-party payloads. Diagnostic detail belongs in the server log,
 * correlated by a trace id, never in {@code statusDescription}.
 *
 * <p>{@link #getHttpStatus()} is the status this outcome <em>would</em> map to in a pure REST
 * design. It is kept so gateways, dashboards, and access logs can still classify traffic while
 * the transport stays {@code 200}. It does not have to be used as the response status.
 */
public enum StatusCode {

    // ---------------------------------------------------------------- 00xx Success
    SUCCESS("0000", "Request completed successfully.", HttpStatus.OK),
    CREATED("0010", "Resource created successfully.", HttpStatus.CREATED),
    UPDATED("0011", "Resource updated successfully.", HttpStatus.OK),
    DELETED("0012", "Resource deleted successfully.", HttpStatus.OK),
    ACCEPTED("0013", "Request accepted and is being processed.", HttpStatus.ACCEPTED),
    NO_RESULTS("0014", "No records matched the request.", HttpStatus.OK),

    // ---------------------------------------------------------------- 01xx Request validation
    VALIDATION_ERROR("0100", "One or more fields are invalid.", HttpStatus.BAD_REQUEST),
    MISSING_REQUIRED_FIELD("0101", "A required field is missing.", HttpStatus.BAD_REQUEST),
    INVALID_FIELD_FORMAT("0102", "A field has an invalid format.", HttpStatus.BAD_REQUEST),
    MALFORMED_REQUEST("0103", "The request body could not be read.", HttpStatus.BAD_REQUEST),
    INVALID_EMAIL_FORMAT("0104", "The email address is not valid.", HttpStatus.BAD_REQUEST),
    WEAK_PASSWORD("0105", "The password does not meet the security requirements.", HttpStatus.BAD_REQUEST),
    INVALID_AMOUNT("0106", "The amount must be a number greater than zero.", HttpStatus.BAD_REQUEST),
    INVALID_DATE_RANGE("0107", "The start date must be on or before the end date.", HttpStatus.BAD_REQUEST),
    INVALID_ENUM_VALUE("0108", "The supplied value is not one of the accepted options.", HttpStatus.BAD_REQUEST),
    EMPTY_BATCH("0109", "The import contains no rows.", HttpStatus.BAD_REQUEST),
    BATCH_SIZE_EXCEEDED("0110", "The import exceeds the maximum number of rows allowed.", HttpStatus.BAD_REQUEST),
    INVALID_FILE_UPLOAD("0111", "The uploaded file is missing, empty, or of an unsupported type.", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE("0112", "The uploaded file exceeds the maximum allowed size.", HttpStatus.PAYLOAD_TOO_LARGE),
    INVALID_PAGINATION("0113", "The page or size parameter is out of range.", HttpStatus.BAD_REQUEST),

    // ---------------------------------------------------------------- 02xx Authentication and authorization
    AUTHENTICATION_FAILED("0200", "Authentication failed.", HttpStatus.UNAUTHORIZED),
    INVALID_CREDENTIALS("0201", "The email or password is incorrect.", HttpStatus.UNAUTHORIZED),
    NOT_AUTHENTICATED("0202", "You must be signed in to perform this action.", HttpStatus.UNAUTHORIZED),
    ACCESS_DENIED("0203", "You do not have permission to perform this action.", HttpStatus.FORBIDDEN),
    ADMIN_PRIVILEGE_REQUIRED("0204", "This action requires an administrator account.", HttpStatus.FORBIDDEN),
    ACCOUNT_DISABLED("0205", "This account has been disabled.", HttpStatus.FORBIDDEN),
    OTP_REQUIRED("0210", "A one-time password is required to continue.", HttpStatus.UNAUTHORIZED),
    OTP_SENT("0211", "A one-time password has been sent to your email.", HttpStatus.OK),
    OTP_INVALID("0212", "The one-time password is incorrect.", HttpStatus.UNAUTHORIZED),
    OTP_EXPIRED("0213", "The one-time password has expired. Request a new one.", HttpStatus.UNAUTHORIZED),
    TOKEN_MISSING("0220", "No authentication token was provided.", HttpStatus.UNAUTHORIZED),
    TOKEN_INVALID("0221", "The authentication token is invalid.", HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED("0222", "The authentication token has expired. Sign in again.", HttpStatus.UNAUTHORIZED),
    GOOGLE_TOKEN_INVALID("0223", "The Google sign-in token could not be verified.", HttpStatus.UNAUTHORIZED),
    PASSWORD_RESET_TOKEN_INVALID("0230", "The password reset link is invalid or has expired.", HttpStatus.UNAUTHORIZED),
    PASSWORD_RESET_FAILED("0231", "The password could not be reset.", HttpStatus.BAD_REQUEST),

    // ---------------------------------------------------------------- 03xx User and account
    USER_NOT_FOUND("0300", "The requested user does not exist.", HttpStatus.NOT_FOUND),
    USER_ALREADY_EXISTS("0301", "An account with these details already exists.", HttpStatus.CONFLICT),
    USERNAME_TAKEN("0302", "That username is already in use.", HttpStatus.CONFLICT),
    EMAIL_TAKEN("0303", "That email address is already registered.", HttpStatus.CONFLICT),
    USER_CREATION_FAILED("0304", "The account could not be created.", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_UPDATE_FAILED("0305", "The account could not be updated.", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_DELETE_FAILED("0306", "The account could not be deleted.", HttpStatus.INTERNAL_SERVER_ERROR),
    PROFILE_PICTURE_UPLOAD_FAILED("0307", "The profile picture could not be saved.", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_ROLE("0310", "The specified role is not recognised.", HttpStatus.BAD_REQUEST),
    CANNOT_MODIFY_OWN_ACCOUNT("0311", "You cannot perform this action on your own account.", HttpStatus.BAD_REQUEST),
    LAST_ADMIN_PROTECTED("0312", "The last administrator account cannot be removed or demoted.", HttpStatus.BAD_REQUEST),
    NO_WALLETS_FOUND("0313", "No wallets found for User", HttpStatus.NOT_FOUND),

    // ---------------------------------------------------------------- 04xx Wallet
    WALLET_NOT_FOUND("0400", "The requested wallet does not exist.", HttpStatus.NOT_FOUND),
    WALLET_NOT_OWNED_BY_USER("0401", "This wallet does not belong to the requesting user.", HttpStatus.FORBIDDEN),
    WALLET_CREATION_FAILED("0402", "The wallet could not be created.", HttpStatus.INTERNAL_SERVER_ERROR),
    WALLET_UPDATE_FAILED("0403", "The wallet could not be updated.", HttpStatus.INTERNAL_SERVER_ERROR),
    WALLET_DELETE_FAILED("0404", "The wallet could not be deleted.", HttpStatus.INTERNAL_SERVER_ERROR),
    INSUFFICIENT_WALLET_BALANCE("0405", "The wallet does not have sufficient funds.", HttpStatus.UNPROCESSABLE_ENTITY),

    // ---------------------------------------------------------------- 05xx Expense
    EXPENSE_NOT_FOUND("0500", "The requested expense does not exist.", HttpStatus.NOT_FOUND),
    EXPENSE_CREATION_FAILED("0501", "The expense could not be created.", HttpStatus.INTERNAL_SERVER_ERROR),
    EXPENSE_UPDATE_FAILED("0502", "The expense could not be updated.", HttpStatus.INTERNAL_SERVER_ERROR),
    EXPENSE_DELETE_FAILED("0503", "The expense could not be deleted.", HttpStatus.INTERNAL_SERVER_ERROR),
    PAYER_NOT_FOUND("0504", "The payer for this expense does not exist.", HttpStatus.NOT_FOUND),
    PARTICIPANTS_REQUIRED("0505", "A shared expense requires at least one participant with valid contribution.", HttpStatus.BAD_REQUEST),
    PARTICIPANT_NOT_FOUND("0506", "One or more participants do not exist.", HttpStatus.NOT_FOUND),
    SPLIT_AMOUNT_MISMATCH("0507", "The participant shares do not add up to the expense total.", HttpStatus.UNPROCESSABLE_ENTITY),
    INVALID_EXPENSE_CATEGORY("0508", "The expense category is not recognised.", HttpStatus.BAD_REQUEST),
    EXPENSE_ALREADY_SETTLED("0509", "A settled expense can no longer be modified.", HttpStatus.CONFLICT),
    EXPENSE_IMPORT_PARTIAL_FAILURE("0510", "Some rows in the import could not be processed.", HttpStatus.MULTI_STATUS),

    // ---------------------------------------------------------------- 06xx Income and transfer
    INCOME_NOT_FOUND("0600", "The requested income entry does not exist.", HttpStatus.NOT_FOUND),
    INCOME_CREATION_FAILED("0601", "The income entry could not be created.", HttpStatus.INTERNAL_SERVER_ERROR),
    INCOME_UPDATE_FAILED("0602", "The income entry could not be updated.", HttpStatus.INTERNAL_SERVER_ERROR),
    INCOME_DELETE_FAILED("0603", "The income entry could not be deleted.", HttpStatus.INTERNAL_SERVER_ERROR),
    TRANSFER_NOT_FOUND("0610", "The requested transfer does not exist.", HttpStatus.NOT_FOUND),
    TRANSFER_CREATION_FAILED("0611", "The transfer could not be created.", HttpStatus.INTERNAL_SERVER_ERROR),
    TRANSFER_UPDATE_FAILED("0612", "The transfer could not be updated.", HttpStatus.INTERNAL_SERVER_ERROR),
    TRANSFER_DELETE_FAILED("0613", "The transfer could not be deleted.", HttpStatus.INTERNAL_SERVER_ERROR),
    TRANSFER_SAME_WALLET("0614", "The source and destination wallets must be different.", HttpStatus.BAD_REQUEST),

    // ---------------------------------------------------------------- 07xx Group
    GROUP_NOT_FOUND("0700", "The requested group does not exist.", HttpStatus.NOT_FOUND),
    GROUP_CREATION_FAILED("0701", "The group could not be created.", HttpStatus.INTERNAL_SERVER_ERROR),
    GROUP_UPDATE_FAILED("0702", "The group could not be updated.", HttpStatus.INTERNAL_SERVER_ERROR),
    GROUP_DELETE_FAILED("0703", "The group could not be deleted.", HttpStatus.INTERNAL_SERVER_ERROR),
    NOT_A_GROUP_MEMBER("0704", "You are not a member of this group.", HttpStatus.FORBIDDEN),
    GROUP_BALANCE_NOT_SETTLED("0705", "Outstanding balances must be settled before leaving or deleting this group.", HttpStatus.UNPROCESSABLE_ENTITY),
    GROUP_PHOTO_UPLOAD_FAILED("0706", "The group photo could not be saved.", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_GROUP_TYPE("0707", "The group type is not recognised.", HttpStatus.BAD_REQUEST),

    // ---------------------------------------------------------------- 08xx Invite and friends
    INVITE_NOT_FOUND("0800", "The requested invite does not exist.", HttpStatus.NOT_FOUND),
    INVITE_ALREADY_EXISTS("0801", "An invite has already been sent to this recipient.", HttpStatus.CONFLICT),
    INVITE_SEND_FAILED("0802", "The invite could not be sent.", HttpStatus.INTERNAL_SERVER_ERROR),
    INVITE_EXPIRED("0803", "This invite has expired.", HttpStatus.GONE),
    INVITE_STATUS_UPDATE_FAILED("0804", "The invite status could not be updated.", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_INVITE_STATUS("0805", "The invite status is not recognised.", HttpStatus.BAD_REQUEST),
    CANNOT_INVITE_SELF("0806", "You cannot send an invite to yourself.", HttpStatus.BAD_REQUEST),
    INVITE_RECIPIENT_NOT_FOUND("0807", "No user was found for the specified recipient.", HttpStatus.NOT_FOUND),
    FRIEND_NOT_FOUND("0810", "The requested friend does not exist.", HttpStatus.NOT_FOUND),
    ALREADY_FRIENDS("0811", "You are already connected with this user.", HttpStatus.CONFLICT),

    // ---------------------------------------------------------------- 09xx Payment and Stripe
    PAYMENT_NOT_FOUND("0900", "The requested payment does not exist.", HttpStatus.NOT_FOUND),
    PAYMENT_CREATION_FAILED("0901", "The payment could not be created.", HttpStatus.INTERNAL_SERVER_ERROR),
    PAYMENT_INTENT_FAILED("0902", "The payment could not be initiated.", HttpStatus.INTERNAL_SERVER_ERROR),
    PAYMENT_CONFIRMATION_FAILED("0903", "The payment could not be confirmed.", HttpStatus.INTERNAL_SERVER_ERROR),
    PAYMENT_DECLINED("0904", "The payment was declined.", HttpStatus.UNPROCESSABLE_ENTITY),
    PAYMENT_ALREADY_PROCESSED("0905", "This payment has already been processed.", HttpStatus.CONFLICT),
    PAYMENT_CANCELLED("0906", "The payment was cancelled.", HttpStatus.OK),
    STRIPE_ACCOUNT_MISSING("0910", "The recipient has not connected a payout account.", HttpStatus.UNPROCESSABLE_ENTITY),
    STRIPE_ACCOUNT_CREATION_FAILED("0911", "The payout account could not be created.", HttpStatus.INTERNAL_SERVER_ERROR),
    STRIPE_API_ERROR("0912", "The payment provider rejected the request.", HttpStatus.BAD_GATEWAY),
    STRIPE_UNAVAILABLE("0913", "The payment provider is temporarily unavailable. Try again shortly.", HttpStatus.SERVICE_UNAVAILABLE),
    WEBHOOK_SIGNATURE_INVALID("0920", "The webhook signature could not be verified.", HttpStatus.BAD_REQUEST),
    WEBHOOK_NOT_CONFIGURED("0921", "Webhook processing is not configured.", HttpStatus.INTERNAL_SERVER_ERROR),
    WEBHOOK_PROCESSING_FAILED("0922", "The webhook event could not be processed.", HttpStatus.INTERNAL_SERVER_ERROR),

    // ---------------------------------------------------------------- 10xx Classification and model
    MODEL_NOT_READY("1000", "The classification model is still training. Try again shortly.", HttpStatus.SERVICE_UNAVAILABLE),
    MODEL_NOT_FOUND("1001", "The requested model does not exist.", HttpStatus.NOT_FOUND),
    PREDICTION_FAILED("1002", "The category could not be predicted.", HttpStatus.INTERNAL_SERVER_ERROR),
    FEEDBACK_FAILED("1003", "The feedback could not be recorded.", HttpStatus.INTERNAL_SERVER_ERROR),
    RETRAIN_FAILED("1004", "The model could not be retrained.", HttpStatus.INTERNAL_SERVER_ERROR),
    SEED_DATA_LOAD_FAILED("1005", "The training seed data could not be loaded.", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_TRAINING_DATA_SOURCE("1006", "The training data source is not recognised.", HttpStatus.BAD_REQUEST),

    // ---------------------------------------------------------------- 11xx Notification and email
    EMAIL_SEND_FAILED("1100", "The email could not be sent.", HttpStatus.INTERNAL_SERVER_ERROR),
    EMAIL_PROVIDER_UNAVAILABLE("1101", "The email provider is temporarily unavailable.", HttpStatus.SERVICE_UNAVAILABLE),
    OTP_SEND_FAILED("1102", "The one-time password could not be sent.", HttpStatus.INTERNAL_SERVER_ERROR),

    // ---------------------------------------------------------------- 90xx System and infrastructure
    INTERNAL_ERROR("9000", "Something went wrong on our side. Please try again.", HttpStatus.INTERNAL_SERVER_ERROR),
    DATABASE_ERROR("9001", "Something went wrong on our side. Please try again.", HttpStatus.INTERNAL_SERVER_ERROR),
    DATA_INTEGRITY_VIOLATION("9002", "The request conflicts with existing data.", HttpStatus.CONFLICT),
    EXTERNAL_SERVICE_UNAVAILABLE("9003", "A required service is temporarily unavailable.", HttpStatus.SERVICE_UNAVAILABLE),
    OPERATION_TIMEOUT("9004", "The request took too long to complete. Please try again.", HttpStatus.GATEWAY_TIMEOUT),
    RATE_LIMIT_EXCEEDED("9005", "Too many requests. Please slow down and try again.", HttpStatus.TOO_MANY_REQUESTS),
    RESOURCE_NOT_FOUND("9006", "The requested resource does not exist.", HttpStatus.NOT_FOUND),
    UNSUPPORTED_OPERATION("9007", "This operation is not supported.", HttpStatus.METHOD_NOT_ALLOWED),
    NOT_IMPLEMENTED("9008", "This feature is not available yet.", HttpStatus.NOT_IMPLEMENTED),
    UNKNOWN_ERROR("9999", "An unexpected error occurred.", HttpStatus.INTERNAL_SERVER_ERROR);

    /** Highest numeric code still considered a success outcome. */
    private static final int SUCCESS_CEILING = 99;

    private static final Map<String, StatusCode> BY_CODE;

    static {
        Map<String, StatusCode> index = new HashMap<>();
        for (StatusCode status : values()) {
            StatusCode clash = index.put(status.code, status);
            if (clash != null) {
                throw new IllegalStateException(
                        "Duplicate StatusCode value " + status.code + " on " + clash + " and " + status);
            }
        }
        BY_CODE = Collections.unmodifiableMap(index);
    }

    private final String code;
    private final String description;
    private final HttpStatus httpStatus;

    StatusCode(String code, String description, HttpStatus httpStatus) {
        this.code = code;
        this.description = description;
        this.httpStatus = httpStatus;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    public boolean isSuccess() {
        return Integer.parseInt(code) <= SUCCESS_CEILING;
    }

    /** Resolve a wire code back to its constant; unknown codes fall back to {@link #UNKNOWN_ERROR}. */
    public static StatusCode fromCode(String code) {
        if (code == null || code.isBlank()) {
            return UNKNOWN_ERROR;
        }
        return BY_CODE.getOrDefault(code.trim(), UNKNOWN_ERROR);
    }
}
