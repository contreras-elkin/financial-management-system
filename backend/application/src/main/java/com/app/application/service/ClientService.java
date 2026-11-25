package com.app.application.service;

import com.app.application.port.in.ClientUseCase;
import com.app.application.port.in.CreateClientCommand;
import com.app.application.port.in.UpdateClientCommand;
import com.app.application.port.out.ClientRepository;
import com.app.domain.exception.ClientNotFoundException;
import com.app.domain.exception.DuplicateClientException;
import com.app.domain.model.Client;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Implementa los casos de uso de clientes. Orquesta: busca, delega las reglas al dominio y persiste
 * a través del puerto de salida, sin conocer la tecnología de base de datos.
 */
public class ClientService implements ClientUseCase {

    private final ClientRepository clientRepository;
    private final Clock clock;

    public ClientService(ClientRepository clientRepository, Clock clock) {
        this.clientRepository = clientRepository;
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
        clientRepository.deleteById(id);
    }

    /**
     * La unicidad depende de los demás clientes, por eso no la valida el modelo sino el caso de uso.
     * La restricción UNIQUE de la base de datos la garantiza ante peticiones concurrentes.
     */
    private void ensureIdentificationIsAvailable(Client client) {
        clientRepository.findByIdentification(client.getIdentificationType(), client.getIdentificationNumber())
                .ifPresent(existing -> {
                    throw new DuplicateClientException(existing.getIdentificationType(),
                            existing.getIdentificationNumber());
                });
    }

    /**
     * Se trunca a microsegundos, la precisión de TIMESTAMP en PostgreSQL, para que la respuesta
     * al crear o actualizar coincida con lo que se lee después de la base de datos.
     */
    private LocalDateTime now() {
        return LocalDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
    }
}
