package com.app.domain.model;

import com.app.domain.exception.InvalidTransactionDataException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

// Inmutable: un movimiento no se edita ni se borra; un error se corrige con un movimiento contrario.
public class Transaction {

    private static final int AMOUNT_SCALE = 2;

    private final Long id;
    private final Long accountId;
    private final TransactionType type;
    private final TransactionDirection direction;
    private final BigDecimal amount;
    private final BigDecimal balanceAfter;
    private final Long counterpartyAccountId;
    private final UUID reference;
    private final LocalDateTime createdAt;

    private Transaction(Long id, Long accountId, TransactionType type, TransactionDirection direction,
                        BigDecimal amount, BigDecimal balanceAfter, Long counterpartyAccountId, UUID reference,
                        LocalDateTime createdAt) {
        this.id = id;
        this.accountId = accountId;
        this.type = type;
        this.direction = direction;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.counterpartyAccountId = counterpartyAccountId;
        this.reference = reference;
        this.createdAt = createdAt;
    }

    // Solo Account crea movimientos, en el mismo paso en que cambia su saldo.
    static Transaction create(Account account, TransactionType type, TransactionDirection direction,
                              BigDecimal amount, Long counterpartyAccountId, UUID reference, LocalDateTime now) {
        return new Transaction(null, account.getId(), type, direction, amount, account.getBalance(),
                counterpartyAccountId, reference, now);
    }

    public static Transaction restore(Long id, Long accountId, TransactionType type, TransactionDirection direction,
                                      BigDecimal amount, BigDecimal balanceAfter, Long counterpartyAccountId,
                                      UUID reference, LocalDateTime createdAt) {
        return new Transaction(id, accountId, type, direction, amount, balanceAfter, counterpartyAccountId,
                reference, createdAt);
    }

    // Lleva el monto a dos decimales, como NUMERIC(19,2); rechaza fracciones de centavo en vez de redondearlas.
    static BigDecimal requireValidAmount(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new InvalidTransactionDataException("Amount must be greater than zero");
        }
        try {
            return amount.setScale(AMOUNT_SCALE, RoundingMode.UNNECESSARY);
        } catch (ArithmeticException e) {
            throw new InvalidTransactionDataException("Amount cannot have more than two decimals");
        }
    }

    public Long getId() { return id; }
    public Long getAccountId() { return accountId; }
    public TransactionType getType() { return type; }
    public TransactionDirection getDirection() { return direction; }
    public BigDecimal getAmount() { return amount; }
    public BigDecimal getBalanceAfter() { return balanceAfter; }
    public Long getCounterpartyAccountId() { return counterpartyAccountId; }
    public UUID getReference() { return reference; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
