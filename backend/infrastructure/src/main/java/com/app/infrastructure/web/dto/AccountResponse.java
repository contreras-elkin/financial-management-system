package com.app.infrastructure.web.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.app.domain.model.Account;
import com.app.domain.model.AccountStatus;
import com.app.domain.model.AccountType;

public record AccountResponse(
        Long id,
        AccountType type,
        String number,
        AccountStatus status,
        BigDecimal balance,
        boolean gmfExempt,
        Long clientId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static AccountResponse from(Account account) {
        return new AccountResponse(account.getId(), account.getType(), account.getNumber(), account.getStatus(),
                account.getBalance(), account.isGmfExempt(), account.getClientId(), account.getCreatedAt(),
                account.getUpdatedAt());
    }
}
