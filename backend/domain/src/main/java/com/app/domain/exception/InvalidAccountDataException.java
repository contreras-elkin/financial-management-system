package com.app.domain.exception;

public class InvalidAccountDataException extends DomainException {

    public InvalidAccountDataException(String message) {
        super("INVALID_ACCOUNT_DATA", message);
    }
}
