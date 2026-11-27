package com.app.infrastructure.config;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

import com.app.application.port.in.ClientUseCase;
import com.app.application.port.in.CreateClientCommand;
import com.app.application.port.in.UpdateClientCommand;
import com.app.domain.model.Client;

/**
 * Decorador: agrega el límite transaccional a cada caso de uso sin modificar ClientService,
 * que no depende de Spring. Cada operación de negocio es una unidad atómica.
 */
public class TransactionalClientUseCase implements ClientUseCase {

    private final ClientUseCase delegate;

    public TransactionalClientUseCase(ClientUseCase delegate){
        this.delegate= delegate;
    }

    @Transactional
    @Override
    public Client create(CreateClientCommand command) {
        return delegate.create(command);
    }

    
    @Transactional(readOnly = true)
    @Override
    public Client findById(Long id) {
        return delegate.findById(id);
    }

    @Transactional(readOnly = true)
    @Override
    public List<Client> findAll() {
        return delegate.findAll();
    }

    @Transactional
    @Override
    public Client update(Long id, UpdateClientCommand command) {
        return delegate.update(id, command);
    }

    @Transactional
    @Override
    public void delete(Long id) {
        delegate.delete(id);
    }

}
