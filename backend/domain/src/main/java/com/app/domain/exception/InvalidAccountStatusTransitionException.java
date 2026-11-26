package com.app.domain.exception;

import com.app.domain.model.AccountStatus;

public class InvalidAccountStatusTransitionException extends ConflictException {

    public InvalidAccountStatusTransitionException(AccountStatus from, AccountStatus to) {
        super("INVALID_ACCOUNT_STATUS_TRANSITION",
                "Account status cannot change from " + from + " to " + to);
    }
}
