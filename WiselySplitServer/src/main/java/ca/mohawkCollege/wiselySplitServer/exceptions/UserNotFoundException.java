package ca.mohawkCollege.wiselySplitServer.exceptions;

import ca.mohawkCollege.wiselySplitServer.jpa.constants.StatusCode;

/** Specialisation of {@link BusinessException} pinned to {@link StatusCode#USER_NOT_FOUND}. */
public class UserNotFoundException extends BusinessException {
    public UserNotFoundException(String message) {
        super(StatusCode.USER_NOT_FOUND, message);
    }
}
