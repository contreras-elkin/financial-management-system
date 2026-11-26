package com.app.application.port.out;

import com.app.domain.model.Account;

import java.util.List;
import java.util.Optional;

/**
 * Puerto de salida: lo que la aplicación necesita de la persistencia de cuentas.
 * Lo implementa un adaptador en infrastructure.
 */
public interface AccountRepository {

    Account save(Account account);

    Optional<Account> findById(Long id);

    List<Account> findAll();

    List<Account> findByClientId(Long clientId);

    /**
     * Indica si el cliente ya tiene una cuenta exenta de GMF que no esté cancelada.
     */
    boolean existsOpenGmfExemptAccount(Long clientId);
}
