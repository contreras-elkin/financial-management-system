package com.app.infrastructure.web.handler;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import com.app.domain.exception.ClientNotFoundException;
import com.app.domain.exception.DomainException;
import com.app.domain.exception.DuplicateClientException;

/**
 * Traduce las excepciones a respuestas HTTP con formato ProblemDetail (RFC 9457).
 * Hereda de ResponseEntityExceptionHandler para que los errores propios de Spring MVC
 * (JSON mal formado, método no soportado, etc.) usen el mismo formato.
 * Cada respuesta propia incluye la extensión {@code code}: un identificador estable del error
 * para que el cliente lo reconozca y lo presente en su idioma sin interpretar el texto.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    /** Códigos de los errores que no nacen en el dominio; los de negocio los define cada excepción. */
    static final String VALIDATION_FAILED = "VALIDATION_FAILED";
    static final String DATA_INTEGRITY_VIOLATION = "DATA_INTEGRITY_VIOLATION";

    @ExceptionHandler(ClientNotFoundException.class)
    public ProblemDetail handleNotFound(ClientNotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "Resource not found", ex.getCode(), ex.getMessage());
    }

    @ExceptionHandler(DuplicateClientException.class)
    public ProblemDetail handleDuplicate(DuplicateClientException ex) {
        return problem(HttpStatus.CONFLICT, "Duplicate resource", ex.getCode(), ex.getMessage());
    }

    /**
     * Resto de reglas de negocio (datos inválidos, menor de edad): la petición no cumple el dominio.
     */
    @ExceptionHandler(DomainException.class)
    public ProblemDetail handleDomain(DomainException ex) {
        return problem(HttpStatus.BAD_REQUEST, "Business rule violated", ex.getCode(), ex.getMessage());
    }

    /**
     * Restricción de la BD violada. Ocurre, por ejemplo, si dos peticiones registran la misma
     * identificación a la vez y ambas pasan la verificación del caso de uso.
     * No se expone el mensaje de la BD porque revela detalles internos del esquema.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrity(DataIntegrityViolationException ex) {
        return problem(HttpStatus.CONFLICT, "Data integrity violation", DATA_INTEGRITY_VIOLATION,
                "The request conflicts with the current state of the data");
    }

    /**
     * Errores de Bean Validation en los DTO de entrada: se devuelve el mensaje de cada campo.
     */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                  HttpHeaders headers, HttpStatusCode status,
                                                                  WebRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }
        ProblemDetail body = problem(HttpStatus.BAD_REQUEST, "Invalid request", VALIDATION_FAILED,
                "One or more fields are invalid");
        body.setProperty("errors", errors);
        return ResponseEntity.badRequest().body(body);
    }

    private static ProblemDetail problem(HttpStatus status, String title, String code, String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title);
        problem.setProperty("code", code);
        return problem;
    }
}
