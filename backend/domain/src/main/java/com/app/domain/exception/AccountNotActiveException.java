package com.app.domain.exception;

public class AccountNotActiveException extends ConflictException {

    public AccountNotActiveException(String accountNumber) {
        super("ACCOUNT_NOT_ACTIVE", "Account " + accountNumber + " is not active");
    }
}
