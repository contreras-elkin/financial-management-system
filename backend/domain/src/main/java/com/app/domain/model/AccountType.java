package com.app.domain.model;

/**
 * Tipos de producto financiero que la entidad ofrece. Cada tipo conoce el prefijo
 * con el que empiezan sus números de cuenta.
 */
public enum AccountType {
    SAVINGS("53"),   // Cuenta de ahorros
    CHECKING("33");  // Cuenta corriente

    private final String numberPrefix;

    AccountType(String numberPrefix) {
        this.numberPrefix = numberPrefix;
    }

    public String getNumberPrefix() {
        return numberPrefix;
    }
}
