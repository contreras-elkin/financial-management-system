package com.app.domain.exception;

public class InvalidTransactionDataException extends DomainException {

    public InvalidTransactionDataException(String message) {
        super("INVALID_TRANSACTION_DATA", message);
    }
}
