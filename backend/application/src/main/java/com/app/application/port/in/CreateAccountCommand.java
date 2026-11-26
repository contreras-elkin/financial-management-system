package com.app.application.port.in;

import com.app.domain.model.AccountType;

/**
 * Datos de entrada para abrir una cuenta. No lleva número, estado, saldo ni fechas:
 * los asigna el sistema.
 */
public record CreateAccountCommand(
        Long clientId,
        AccountType type,
        boolean gmfExempt
) {
}
