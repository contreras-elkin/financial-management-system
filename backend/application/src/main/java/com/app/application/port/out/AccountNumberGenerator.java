package com.app.application.port.out;

import com.app.domain.model.AccountType;

/**
 * Puerto de salida: entrega un número de cuenta nuevo y único para el tipo indicado.
 * El caso de uso no sabe cómo se garantiza la unicidad (una secuencia de la base de datos,
 * un servicio externo...); solo recibe el número.
 */
public interface AccountNumberGenerator {

    String nextNumber(AccountType type);
}
