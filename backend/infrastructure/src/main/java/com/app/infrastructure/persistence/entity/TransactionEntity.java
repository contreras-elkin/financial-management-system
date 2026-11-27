package com.app.infrastructure.persistence.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.app.domain.model.TransactionDirection;
import com.app.domain.model.TransactionType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// Ninguna columna es actualizable: un movimiento se inserta una vez y no se modifica.
@Entity
@Table(name = "transactions")
public class TransactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Long accountId;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, updatable = false, length = 10)
    private TransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false, length = 6)
    private TransactionDirection direction;

    @Column(nullable = false, updatable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, updatable = false, precision = 19, scale = 2)
    private BigDecimal balanceAfter;

    @Column(updatable = false)
    private Long counterpartyAccountId;

    @Column(nullable = false, updatable = false)
    private UUID reference;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected TransactionEntity() {
    }

    public TransactionEntity(Long id, Long accountId, TransactionType type, TransactionDirection direction,
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
