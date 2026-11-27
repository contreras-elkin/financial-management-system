package com.app.infrastructure.web.dto;

import java.math.BigDecimal;

import com.app.application.port.in.TransferCommand;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record TransferRequest(
        @NotNull
        Long sourceAccountId,
        @NotNull
        Long targetAccountId,
        @NotNull
        @Positive
        @Digits(integer = 17, fraction = 2)
        BigDecimal amount
) {
    public TransferCommand toCommand() {
        return new TransferCommand(sourceAccountId, targetAccountId, amount);
    }
}
