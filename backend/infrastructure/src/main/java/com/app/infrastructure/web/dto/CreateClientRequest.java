package com.app.infrastructure.web.dto;

import java.time.LocalDate;

import com.app.application.port.in.CreateClientCommand;
import com.app.domain.model.IdentificationType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

/**
 * JSON de entrada para registrar un cliente. Valida el formato de la petición;
 * las reglas de negocio (mayoría de edad, formato de correo) las aplica el dominio.
 */
public record CreateClientRequest(
        @NotNull
        IdentificationType identificationType,
        @NotBlank
        @Size(max = 20)
        String identificationNumber,
        @NotBlank
        @Size(min = 2, max = 100)
        String firstName,
        @NotBlank
        @Size(min = 2, max = 100)
        String lastName,
        @NotBlank
        @Size(max = 150)
        String email,
        @NotNull
        @Past
        LocalDate birthDate
) {
    public CreateClientCommand toCommand() {
        return new CreateClientCommand(identificationType, identificationNumber, firstName, lastName, email, birthDate);
    }
}
