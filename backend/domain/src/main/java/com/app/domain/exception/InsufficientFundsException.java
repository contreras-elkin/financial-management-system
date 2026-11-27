package com.app.domain.exception;

public class InsufficientFundsException extends ConflictException {

    public InsufficientFundsException(String accountNumber) {
        super("INSUFFICIENT_FUNDS", "Account " + accountNumber + " does not have enough available balance");
    }
}
