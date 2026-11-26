package com.app.domain.exception;

public class ClientNotFoundException extends DomainException {

    public ClientNotFoundException(Long id) {
        super("CLIENT_NOT_FOUND", "Client not found with id " + id);
    }
}
