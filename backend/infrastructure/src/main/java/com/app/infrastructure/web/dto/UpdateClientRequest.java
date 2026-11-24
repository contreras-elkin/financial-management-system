package com.app.infrastructure.web.dto;

import java.time.LocalDate;

import com.app.application.port.in.UpdateClientCommand;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

/**
 * JSON de entrada para modificar un cliente. La identificación no se incluye porque es inmutable.
 */
public record UpdateClientRequest(
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
    public UpdateClientCommand toCommand() {
        return new UpdateClientCommand(firstName, lastName, email, birthDate);
    }
}
