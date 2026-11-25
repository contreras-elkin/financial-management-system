package com.app.infrastructure.persistence.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.app.domain.model.IdentificationType;
import com.app.infrastructure.persistence.entity.ClientEntity;

/**
 * Repositorio de Spring Data: la implementación se genera en tiempo de ejecución.
 * La consulta se deriva del nombre del método.
 */
public interface ClientJpaRepository extends JpaRepository<ClientEntity, Long> {

    Optional<ClientEntity> findByIdentificationTypeAndIdentificationNumber(
            IdentificationType identificationType, String identificationNumber);
}
