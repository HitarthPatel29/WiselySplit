package ca.mohawkCollege.wiselySplitServer.exceptions;

import ca.mohawkCollege.wiselySplitServer.jpa.constants.StatusCode;

/** Specialisation of {@link BusinessException} pinned to {@link StatusCode#USER_ALREADY_EXISTS}. */
public class DuplicateUserException extends BusinessException {
    public DuplicateUserException(String message) {
        super(StatusCode.USER_ALREADY_EXISTS, message);
    }
}
