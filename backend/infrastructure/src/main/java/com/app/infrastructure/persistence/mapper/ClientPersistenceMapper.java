package com.app.infrastructure.persistence.mapper;

import org.springframework.stereotype.Component;

import com.app.domain.model.Client;
import com.app.infrastructure.persistence.entity.ClientEntity;

/**
 * Traduce entre el modelo de dominio y la entidad JPA.
 */
@Component
public class ClientPersistenceMapper {

    public ClientEntity toEntity(Client client) {
        return new ClientEntity(
                client.getId(),
                client.getIdentificationType(),
                client.getIdentificationNumber(),
                client.getFirstName(),
                client.getLastName(),
                client.getEmail(),
                client.getBirthDate(),
                client.getCreatedAt(),
                client.getUpdatedAt());
    }

    /**
     * Usa restore: los datos guardados ya cumplieron las reglas, no se validan ni se les asignan fechas nuevas.
     */
    public Client toDomain(ClientEntity entity) {
        return Client.restore(
                entity.getId(),
                entity.getIdentificationType(),
                entity.getIdentificationNumber(),
                entity.getFirstName(),
                entity.getLastName(),
                entity.getEmail(),
                entity.getBirthDate(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }
}
