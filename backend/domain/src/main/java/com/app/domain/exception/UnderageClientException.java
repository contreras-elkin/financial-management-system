package com.app.domain.exception;

public class UnderageClientException extends DomainException {

    public UnderageClientException() {
        super("CLIENT_UNDERAGE", "The client must be of legal age");
    }
}
