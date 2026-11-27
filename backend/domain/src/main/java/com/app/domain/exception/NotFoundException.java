package com.app.domain.exception;

/**
 * Categoría de los errores en los que el recurso solicitado no existe.
 * El adaptador web traduce toda la categoría de una vez, así que una excepción nueva
 * de este tipo no obliga a modificar el manejador de errores.
 */
public abstract class NotFoundException extends DomainException {

    protected NotFoundException(String code, String message) {
        super(code, message);
    }
}
