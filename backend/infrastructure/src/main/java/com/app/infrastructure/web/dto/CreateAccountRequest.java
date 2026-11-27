package com.app.infrastructure.web.dto;

import com.app.application.port.in.CreateAccountCommand;
import com.app.domain.model.AccountType;

import jakarta.validation.constraints.NotNull;

public record CreateAccountRequest(
        @NotNull
        Long clientId,
        @NotNull
        AccountType type,
        @NotNull
        Boolean gmfExempt
) {
    public CreateAccountCommand toCommand() {
        return new CreateAccountCommand(clientId, type, gmfExempt);
    }
}
