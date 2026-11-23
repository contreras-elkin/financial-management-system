package com.app.application.port.out;

import com.app.domain.model.Client;
import com.app.domain.model.IdentificationType;

import java.util.List;
import java.util.Optional;

/**
 * Puerto de salida: lo que la aplicación necesita de la persistencia de clientes.
 * Lo implementa un adaptador en infrastructure.
 */
public interface ClientRepository {

    Client save(Client client);

    Optional<Client> findById(Long id);

    List<Client> findAll();

    Optional<Client> findByIdentification(IdentificationType type, String number);

    void deleteById(Long id);
}
