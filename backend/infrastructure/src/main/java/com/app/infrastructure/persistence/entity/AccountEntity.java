package com.app.infrastructure.persistence.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.app.domain.model.AccountStatus;
import com.app.domain.model.AccountType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * El cliente se guarda como id y no como relación @ManyToOne: la cuenta no necesita cargar
 * al cliente, y la FK de la base de datos ya garantiza que exista.
 */
@Entity
@Table(name = "accounts")
public class AccountEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false, updatable = false, length = 10)
    private AccountType type;

    @Column(nullable = false, updatable = false, length = 10)
    private String number;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AccountStatus status;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal balance;

    @Column(nullable = false, updatable = false)
    private boolean gmfExempt;

    @Column(nullable = false, updatable = false)
    private Long clientId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected AccountEntity() {
    }

    public AccountEntity(Long id, AccountType type, String number, AccountStatus status, BigDecimal balance,
                         boolean gmfExempt, Long clientId, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.type = type;
        this.number = number;
        this.status = status;
        this.balance = balance;
        this.gmfExempt = gmfExempt;
        this.clientId = clientId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public AccountType getType() { return type; }
    public String getNumber() { return number; }
    public AccountStatus getStatus() { return status; }
    public BigDecimal getBalance() { return balance; }
    public boolean isGmfExempt() { return gmfExempt; }
    public Long getClientId() { return clientId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
