package com.app.infrastructure.web.dto;

import java.math.BigDecimal;

import com.app.application.port.in.WithdrawalCommand;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record WithdrawalRequest(
        @NotNull
        Long accountId,
        @NotNull
        @Positive
        @Digits(integer = 17, fraction = 2)
        BigDecimal amount
) {
    public WithdrawalCommand toCommand() {
        return new WithdrawalCommand(accountId, amount);
    }
}
