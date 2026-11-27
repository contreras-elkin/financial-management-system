package com.app.application.service;

import com.app.application.port.in.ClientUseCase;
import com.app.application.port.in.CreateClientCommand;
import com.app.application.port.in.UpdateClientCommand;
import com.app.application.port.out.AccountRepository;
import com.app.application.port.out.ClientRepository;
import com.app.domain.exception.ClientHasProductsException;
import com.app.domain.exception.ClientNotFoundException;
import com.app.domain.exception.DuplicateClientException;
import com.app.domain.model.Client;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

public class ClientService implements ClientUseCase {

    private final ClientRepository clientRepository;
    private final AccountRepository accountRepository;
    private final Clock clock;

    public ClientService(ClientRepository clientRepository, AccountRepository accountRepository, Clock clock) {
        this.clientRepository = clientRepository;
        this.accountRepository = accountRepository;
        this.clock = clock;
    }

    @Override
    public Client create(CreateClientCommand command) {
        Client client = Client.create(
                command.identificationType(),
                command.identificationNumber(),
                command.firstName(),
                command.lastName(),
                command.email(),
                command.birthDate(),
                now());
        ensureIdentificationIsAvailable(client);
        return clientRepository.save(client);
    }

    @Override
    public Client findById(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new ClientNotFoundException(id));
    }

    @Override
    public List<Client> findAll() {
        return clientRepository.findAll();
    }

    @Override
    public Client update(Long id, UpdateClientCommand command) {
        Client client = findById(id);
        client.update(
                command.firstName(),
                command.lastName(),
                command.email(),
                command.birthDate(),
                now());
        return clientRepository.save(client);
    }

    @Override
    public void delete(Long id) {
        findById(id);
        if (accountRepository.existsByClientId(id)) {
            throw new ClientHasProductsException(id);
        }
        clientRepository.deleteById(id);
    }

    // Ante peticiones concurrentes, la restricción UNIQUE de la base de datos es la garantía final.
    private void ensureIdentificationIsAvailable(Client client) {
        clientRepository.findByIdentification(client.getIdentificationType(), client.getIdentificationNumber())
                .ifPresent(existing -> {
                    throw new DuplicateClientException(existing.getIdentificationType(),
                            existing.getIdentificationNumber());
                });
    }

    // Microsegundos: la precisión de TIMESTAMP en PostgreSQL.
    private LocalDateTime now() {
        return LocalDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
    }
}
