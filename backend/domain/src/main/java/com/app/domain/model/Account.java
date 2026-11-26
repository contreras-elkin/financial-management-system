package com.app.domain.model;

import com.app.domain.exception.AccountBalanceNotZeroException;
import com.app.domain.exception.InvalidAccountDataException;
import com.app.domain.exception.InvalidAccountStatusTransitionException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.regex.Pattern;

/**
 * Producto financiero (cuenta de ahorros o corriente) de un cliente. Modelo rico: controla
 * sus propios cambios de estado, de modo que nunca puede quedar en una situación inválida
 * (por ejemplo, cancelada con saldo o reactivada después de cancelarse).
 * El cliente se referencia por su id: cuenta y cliente son agregados distintos.
 */
public class Account {

    private static final Pattern NUMBER_PATTERN = Pattern.compile("^\\d{10}$");

    private final Long id;
    private final AccountType type;
    private final String number;
    private AccountStatus status;
    private final BigDecimal balance;
    private final boolean gmfExempt;
    private final Long clientId;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Account(Long id, AccountType type, String number, AccountStatus status, BigDecimal balance,
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

    /**
     * Abre una cuenta nueva: activa y con saldo cero. El saldo solo cambiará con transacciones.
     * El número lo genera quien llama (es único en todo el sistema); aquí se valida su formato.
     */
    public static Account create(AccountType type, String number, Long clientId, boolean gmfExempt,
                                 LocalDateTime now) {
        validate(type, number, clientId);
        return new Account(null, type, number, AccountStatus.ACTIVE, BigDecimal.ZERO, gmfExempt, clientId,
                now, now);
    }

    /**
     * Reconstruye una cuenta ya persistida. No vuelve a validar: lo guardado ya cumplió las reglas.
     */
    public static Account restore(Long id, AccountType type, String number, AccountStatus status,
                                  BigDecimal balance, boolean gmfExempt, Long clientId,
                                  LocalDateTime createdAt, LocalDateTime updatedAt) {
        return new Account(id, type, number, status, balance, gmfExempt, clientId, createdAt, updatedAt);
    }

    public void activate(LocalDateTime now) {
        changeStatus(AccountStatus.ACTIVE, now);
    }

    public void inactivate(LocalDateTime now) {
        changeStatus(AccountStatus.INACTIVE, now);
    }

    /**
     * Cancela la cuenta. Solo es posible con saldo cero, y es definitivo.
     */
    public void cancel(LocalDateTime now) {
        if (status != AccountStatus.CANCELLED && balance.signum() != 0) {
            throw new AccountBalanceNotZeroException(number);
        }
        changeStatus(AccountStatus.CANCELLED, now);
    }

    /**
     * Pedir el estado que ya tiene no es un error ni una modificación (operación idempotente):
     * no se lanza excepción ni cambia la fecha de modificación.
     */
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
    public boolean isGmfExempt() { return gmfExempt; }
    public Long getClientId() { return clientId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
