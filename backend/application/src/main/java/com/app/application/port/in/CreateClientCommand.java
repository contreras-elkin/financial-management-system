package com.app.application.port.in;

import com.app.domain.model.IdentificationType;

import java.time.LocalDate;

/**
 * Datos de entrada para registrar un cliente. No lleva id ni fechas: los asigna el sistema.
 */
public record CreateClientCommand(
        IdentificationType identificationType,
        String identificationNumber,
        String firstName,
        String lastName,
        String email,
        LocalDate birthDate
) {
}
