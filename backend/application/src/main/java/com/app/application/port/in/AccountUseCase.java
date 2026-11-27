package com.app.application.port.in;

import com.app.domain.model.Account;

import java.util.List;

/**
 * Puerto de entrada: operaciones que la aplicación ofrece sobre cuentas.
 * No hay borrado: una cuenta se cancela y su registro se conserva.
 */
public interface AccountUseCase {

    Account create(CreateAccountCommand command);

    Account findById(Long id);

    List<Account> findAll();

    List<Account> findByClientId(Long clientId);

    Account activate(Long id);

    Account inactivate(Long id);

    Account cancel(Long id);
}
