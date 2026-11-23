package com.app.application.port.in;

import java.time.LocalDate;

/**
 * Datos de entrada para modificar un cliente. El id viaja aparte (identifica el recurso).
 * La identificación (tipo y número) no se incluye: es inmutable una vez registrado el cliente.
 */
public record UpdateClientCommand(
        String firstName,
        String lastName,
        String email,
        LocalDate birthDate
) {
}
