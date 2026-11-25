package com.app.domain.exception;

public class UnderageClientException extends DomainException {

    public UnderageClientException() {
        super("The client must be of legal age");
    }
}
