package com.app.domain.exception;

import com.app.domain.model.IdentificationType;

public class DuplicateClientException extends DomainException {

    public DuplicateClientException(IdentificationType type, String number) {
        super("A client already exists with identification " + type + " " + number);
    }
}
