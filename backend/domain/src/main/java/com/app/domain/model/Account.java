package com.app.domain.model;

import com.app.domain.exception.AccountBalanceNotZeroException;
import com.app.domain.exception.InvalidAccountDataException;
import com.app.domain.exception.InvalidAccountStatusTransitionException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.regex.Pattern;

public class Account {

    private static final Pattern NUMBER_PATTERN = Pattern.compile("^\\d{10}$");
    private static final BigDecimal INITIAL_BALANCE = new BigDecimal("0.00");

    private final Long id;
    private final AccountType type;
    private final String number;
    private AccountStatus status;
    private final BigDecimal balance;
    private final BigDecimal overdraftLimit;
    private final boolean gmfExempt;
    private final Long clientId;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Account(Long id, AccountType type, String number, AccountStatus status, BigDecimal balance,
                    BigDecimal overdraftLimit, boolean gmfExempt, Long clientId, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.type = type;
        this.number = number;
        this.status = status;
        this.balance = balance;
        this.overdraftLimit = overdraftLimit;
        this.gmfExempt = gmfExempt;
        this.clientId = clientId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // El número lo genera quien llama, porque su unicidad depende de las demás cuentas; aquí solo se valida
    // el formato. El cupo se copia del tipo para que un cambio de política no afecte a las cuentas abiertas.
    public static Account create(AccountType type, String number, Long clientId, boolean gmfExempt,
                                 LocalDateTime now) {
        validate(type, number, clientId);
        return new Account(null, type, number, AccountStatus.ACTIVE, INITIAL_BALANCE,
                type.getDefaultOverdraftLimit(), gmfExempt, clientId, now, now);
    }

    public static Account restore(Long id, AccountType type, String number, AccountStatus status,
                                  BigDecimal balance, BigDecimal overdraftLimit, boolean gmfExempt,
                                  Long clientId, LocalDateTime createdAt, LocalDateTime updatedAt) {
        return new Account(id, type, number, status, balance, overdraftLimit, gmfExempt, clientId, createdAt,
                updatedAt);
    }

    // Se calcula y no se guarda: así nunca puede quedar desalineado del saldo.
    public BigDecimal availableBalance() {
        return balance.add(overdraftLimit);
    }

    public void activate(LocalDateTime now) {
        changeStatus(AccountStatus.ACTIVE, now);
    }

    public void inactivate(LocalDateTime now) {
        changeStatus(AccountStatus.INACTIVE, now);
    }

    public void cancel(LocalDateTime now) {
        if (status != AccountStatus.CANCELLED && balance.signum() != 0) {
            throw new AccountBalanceNotZeroException(number);
        }
        changeStatus(AccountStatus.CANCELLED, now);
    }

    // Pedir el estado actual es idempotente: no falla ni cambia updatedAt.
    private void changeStatus(AccountStatus target, LocalDateTime now) {
        if (status == target) {
            return;
        }
        if (!status.canTransitionTo(target)) {
            throw new InvalidAccountStatusTransitionException(status, target);
        }
        this.status = target;
        this.updatedAt = now;
    }

    private static void validate(AccountType type, String number, Long clientId) {
        if (type == null) {
            throw new InvalidAccountDataException("Account type is required");
        }
        if (clientId == null) {
            throw new InvalidAccountDataException("Client is required");
        }
        if (number == null || !NUMBER_PATTERN.matcher(number).matches()
                || !number.startsWith(type.getNumberPrefix())) {
            throw new InvalidAccountDataException(
                    "Account number must have 10 digits and start with " + type.getNumberPrefix());
        }
    }

    public Long getId() { return id; }
    public AccountType getType() { return type; }
    public String getNumber() { return number; }
    public AccountStatus getStatus() { return status; }
    public BigDecimal getBalance() { return balance; }
    public BigDecimal getOverdraftLimit() { return overdraftLimit; }
    public boolean isGmfExempt() { return gmfExempt; }
    public Long getClientId() { return clientId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
