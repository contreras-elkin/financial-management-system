package com.app.domain.exception;

public class AccountNotFoundException extends NotFoundException {

    public AccountNotFoundException(Long id) {
        super("ACCOUNT_NOT_FOUND", "Account not found with id " + id);
    }
}
