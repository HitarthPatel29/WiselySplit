package ca.mohawkCollege.wiselySplitServer.exceptions;

public class InvalidRefreshTokenException extends RuntimeException {

    /**
     * False when the token was just rotated by a concurrent request (e.g. another tab):
     * the session is still alive and the client's cookie jar already holds the newer token.
     */
    private final boolean sessionEnded;

    public InvalidRefreshTokenException(String message) {
        this(message, true);
    }

    public InvalidRefreshTokenException(String message, boolean sessionEnded) {
        super(message);
        this.sessionEnded = sessionEnded;
    }

    public boolean isSessionEnded() {
        return sessionEnded;
    }
}
