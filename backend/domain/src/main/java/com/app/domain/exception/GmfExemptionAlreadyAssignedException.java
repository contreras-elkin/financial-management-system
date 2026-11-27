package com.app.domain.exception;

public class GmfExemptionAlreadyAssignedException extends ConflictException {

    public GmfExemptionAlreadyAssignedException(Long clientId) {
        super("GMF_EXEMPTION_ALREADY_ASSIGNED",
                "Client " + clientId + " already has a GMF exempt account");
    }
}
