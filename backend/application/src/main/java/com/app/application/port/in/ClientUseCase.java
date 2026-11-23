package com.app.application.port.in;

import com.app.domain.model.Client;

import java.util.List;

/**
 * Puerto de entrada: operaciones que la aplicación ofrece sobre clientes.
 */
public interface ClientUseCase {

    Client create(CreateClientCommand command);

    Client findById(Long id);

    List<Client> findAll();

    Client update(Long id, UpdateClientCommand command);

    void delete(Long id);
}
