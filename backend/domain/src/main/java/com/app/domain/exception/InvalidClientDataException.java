package com.app.domain.exception;

public class InvalidClientDataException extends DomainException {

    public InvalidClientDataException(String message) {
        super("INVALID_CLIENT_DATA", message);
    }
}
