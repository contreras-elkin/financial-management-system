package com.app.infrastructure.config;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

import com.app.application.port.in.AccountUseCase;
import com.app.application.port.in.CreateAccountCommand;
import com.app.domain.model.Account;

/**
 * En create, las verificaciones, el número de la secuencia y el insert van en la misma transacción.
 */
public class TransactionalAccountUseCase implements AccountUseCase {

    private final AccountUseCase delegate;

    public TransactionalAccountUseCase(AccountUseCase delegate) {
        this.delegate = delegate;
    }

    @Transactional
    @Override
    public Account create(CreateAccountCommand command) {
        return delegate.create(command);
    }

    @Transactional(readOnly = true)
    @Override
    public Account findById(Long id) {
        return delegate.findById(id);
    }

    @Transactional(readOnly = true)
    @Override
    public List<Account> findAll() {
        return delegate.findAll();
    }

    @Transactional(readOnly = true)
    @Override
    public List<Account> findByClientId(Long clientId) {
        return delegate.findByClientId(clientId);
    }

    @Transactional
    @Override
    public Account activate(Long id) {
        return delegate.activate(id);
    }

    @Transactional
    @Override
    public Account inactivate(Long id) {
        return delegate.inactivate(id);
    }

    @Transactional
    @Override
    public Account cancel(Long id) {
        return delegate.cancel(id);
    }
}
