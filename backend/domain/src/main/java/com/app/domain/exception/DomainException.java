package com.app.domain.exception;

/**
 * Base de las excepciones de negocio. Permite que el adaptador web las trate de forma uniforme.
 * El código identifica la regla violada de forma estable, independiente del idioma del mensaje,
 * para que los clientes de la API puedan reconocer el error sin interpretar el texto.
 */
public abstract class DomainException extends RuntimeException {

    private final String code;

    protected DomainException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
