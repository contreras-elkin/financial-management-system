package com.app.domain.exception;

public class AccountBalanceNotZeroException extends ConflictException {

    public AccountBalanceNotZeroException(String accountNumber) {
        super("ACCOUNT_BALANCE_NOT_ZERO",
                "Account " + accountNumber + " can only be cancelled with a zero balance");
    }
}
