package ca.mohawk_college.wiselysplit_server.exceptions;

import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;

/** Specialisation of {@link BusinessException} pinned to {@link StatusCode#USER_NOT_FOUND}. */
public class UserNotFoundException extends BusinessException {
    public UserNotFoundException(String message) {
        super(StatusCode.USER_NOT_FOUND, message);
    }
    public UserNotFoundException(){
        super(StatusCode.USER_NOT_FOUND);
    }
}
