package com.app.infrastructure.web.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.app.domain.model.Transaction;
import com.app.domain.model.TransactionDirection;
import com.app.domain.model.TransactionType;

public record TransactionResponse(
        Long id,
        Long accountId,
        TransactionType type,
        TransactionDirection direction,
        BigDecimal amount,
        BigDecimal balanceAfter,
        Long counterpartyAccountId,
        UUID reference,
        LocalDateTime createdAt
) {
    public static TransactionResponse from(Transaction transaction) {
        return new TransactionResponse(transaction.getId(), transaction.getAccountId(), transaction.getType(),
                transaction.getDirection(), transaction.getAmount(), transaction.getBalanceAfter(),
                transaction.getCounterpartyAccountId(), transaction.getReference(), transaction.getCreatedAt());
    }
}
