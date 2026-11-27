package com.app.domain.exception;

public class ClientHasProductsException extends ConflictException {

    public ClientHasProductsException(Long clientId) {
        super("CLIENT_HAS_PRODUCTS", "Client " + clientId + " cannot be deleted because it has linked products");
    }
}
