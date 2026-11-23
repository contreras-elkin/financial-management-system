package com.app.domain.exception;

public class ClientNotFoundException extends DomainException {

    public ClientNotFoundException(Long id) {
        super("Client not found with id " + id);
    }
}
