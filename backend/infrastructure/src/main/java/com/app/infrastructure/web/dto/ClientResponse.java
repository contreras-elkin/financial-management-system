package com.app.infrastructure.web.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.app.domain.model.Client;
import com.app.domain.model.IdentificationType;

/**
 * JSON de salida de un cliente. Define explícitamente qué datos expone la API.
 */
public record ClientResponse(
        Long id,
        IdentificationType identificationType,
        String identificationNumber,
        String firstName,
        String lastName,
        String email,
        LocalDate birthDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ClientResponse from(Client client) {
        return new ClientResponse(client.getId(), client.getIdentificationType(),
                client.getIdentificationNumber(), client.getFirstName(), client.getLastName(), client.getEmail(),
                client.getBirthDate(), client.getCreatedAt(), client.getUpdatedAt());
    }
}
