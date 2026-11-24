package com.app.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.app.application.port.out.ClientRepository;
import com.app.domain.model.Client;
import com.app.domain.model.IdentificationType;
import com.app.infrastructure.persistence.mapper.ClientPersistenceMapper;
import com.app.infrastructure.persistence.repository.ClientJpaRepository;

/**
 * Adaptador de salida: implementa el puerto ClientRepository con Spring Data JPA.
 * Hacia afuera habla en Client (dominio); por dentro trabaja con ClientEntity.
 */
@Component
public class ClientPersistenceAdapter implements ClientRepository {

    private final ClientJpaRepository clientJpaRepository;
    private final ClientPersistenceMapper clientPersistenceMapper;

    public ClientPersistenceAdapter(ClientJpaRepository clientJpaRepository,
                                    ClientPersistenceMapper clientPersistenceMapper) {
        this.clientJpaRepository = clientJpaRepository;
        this.clientPersistenceMapper = clientPersistenceMapper;
    }

    @Override
    public Client save(Client client) {
        var saved = clientJpaRepository.save(clientPersistenceMapper.toEntity(client));
        return clientPersistenceMapper.toDomain(saved);
    }

    @Override
    public Optional<Client> findById(Long id) {
        return clientJpaRepository.findById(id)
                .map(clientPersistenceMapper::toDomain);
    }

    @Override
    public List<Client> findAll() {
        return clientJpaRepository.findAll().stream()
                .map(clientPersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public Optional<Client> findByIdentification(IdentificationType type, String number) {
        return clientJpaRepository.findByIdentificationTypeAndIdentificationNumber(type, number)
                .map(clientPersistenceMapper::toDomain);
    }

    @Override
    public void deleteById(Long id) {
        clientJpaRepository.deleteById(id);
    }
}
