package com.app.domain.exception;

/**
 * Categoría de los errores en los que la petición es válida, pero choca con el estado actual
 * de los datos: un recurso duplicado, una cuenta con saldo que se intenta cancelar, etc.
 * El adaptador web traduce toda la categoría de una vez, así que una excepción nueva
 * de este tipo no obliga a modificar el manejador de errores.
 */
public abstract class ConflictException extends DomainException {

    protected ConflictException(String code, String message) {
        super(code, message);
    }
}
