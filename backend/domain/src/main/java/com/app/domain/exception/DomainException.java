package com.app.domain.exception;

/**
 * Base de las excepciones de negocio. Permite que el adaptador web las trate de forma uniforme.
 */
public abstract class DomainException extends RuntimeException {

    protected DomainException(String message) {
        super(message);
    }
}
