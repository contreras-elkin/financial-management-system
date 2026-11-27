package com.app.domain.model;

import java.math.BigDecimal;

public enum AccountType {
    SAVINGS("53", new BigDecimal("0.00")),           // Cuenta de ahorros: nunca baja de $0
    CHECKING("33", new BigDecimal("1000000.00"));    // Cuenta corriente: admite sobregiro

    private final String numberPrefix;
    private final BigDecimal defaultOverdraftLimit;

    AccountType(String numberPrefix, BigDecimal defaultOverdraftLimit) {
        this.numberPrefix = numberPrefix;
        this.defaultOverdraftLimit = defaultOverdraftLimit;
    }

    public String getNumberPrefix() {
        return numberPrefix;
    }

    public BigDecimal getDefaultOverdraftLimit() {
        return defaultOverdraftLimit;
    }
}
