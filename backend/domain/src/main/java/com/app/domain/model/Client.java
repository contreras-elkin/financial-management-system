package com.app.domain.model;

import com.app.domain.exception.InvalidClientDataException;
import com.app.domain.exception.UnderageClientException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.regex.Pattern;

/**
 * Cliente de la entidad financiera. Modelo rico: valida sus propias reglas, de modo que
 * nunca puede existir una instancia inválida (menor de edad, correo o nombres incorrectos).
 */
public class Client {

    private static final int LEGAL_AGE = 18;
    private static final int MIN_NAME_LENGTH = 2;
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[\\w.+-]+@[\\w-]+(\\.[\\w-]+)*\\.[A-Za-z]{2,}$");

    private final Long id;
    private final IdentificationType identificationType;
    private final String identificationNumber;
    private String firstName;
    private String lastName;
    private String email;
    private LocalDate birthDate;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Client(Long id, IdentificationType identificationType, String identificationNumber,
                   String firstName, String lastName, String email, LocalDate birthDate,
                   LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.identificationType = identificationType;
        this.identificationNumber = identificationNumber;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.birthDate = birthDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /**
     * Registra un cliente nuevo. La fecha de creación se asigna aquí, no la envía quien llama.
     */
    public static Client create(IdentificationType identificationType, String identificationNumber,
                                String firstName, String lastName, String email, LocalDate birthDate,
                                LocalDateTime now) {
        validateIdentification(identificationType, identificationNumber);
        validatePersonalData(firstName, lastName, email, birthDate, now);
        return new Client(null, identificationType, identificationNumber.trim(), firstName.trim(),
                lastName.trim(), email.trim(), birthDate, now, now);
    }

    /**
     * Reconstruye un cliente ya persistido. No vuelve a validar: lo guardado ya cumplió las reglas.
     */
    public static Client restore(Long id, IdentificationType identificationType, String identificationNumber,
                                 String firstName, String lastName, String email, LocalDate birthDate,
                                 LocalDateTime createdAt, LocalDateTime updatedAt) {
        return new Client(id, identificationType, identificationNumber, firstName, lastName, email,
                birthDate, createdAt, updatedAt);
    }

    /**
     * Modifica los datos personales aplicando las mismas reglas que al crearlo.
     * La identificación no cambia: es la que distingue al cliente en la entidad.
     * La fecha de modificación se recalcula automáticamente.
     */
    public void update(String firstName, String lastName, String email, LocalDate birthDate,
                       LocalDateTime now) {
        validatePersonalData(firstName, lastName, email, birthDate, now);
        this.firstName = firstName.trim();
        this.lastName = lastName.trim();
        this.email = email.trim();
        this.birthDate = birthDate;
        this.updatedAt = now;
    }

    private static void validateIdentification(IdentificationType identificationType, String identificationNumber) {
        if (identificationType == null) {
            throw new InvalidClientDataException("Identification type is required");
        }
        if (isBlank(identificationNumber)) {
            throw new InvalidClientDataException("Identification number is required");
        }
    }

    private static void validatePersonalData(String firstName, String lastName, String email,
                                             LocalDate birthDate, LocalDateTime now) {
        requireMinLength(firstName, "First name");
        requireMinLength(lastName, "Last name");
        if (isBlank(email) || !EMAIL_PATTERN.matcher(email.trim()).matches()) {
            throw new InvalidClientDataException("Email format is invalid");
        }
        if (birthDate == null) {
            throw new InvalidClientDataException("Birth date is required");
        }
        if (Period.between(birthDate, now.toLocalDate()).getYears() < LEGAL_AGE) {
            throw new UnderageClientException();
        }
    }

    private static void requireMinLength(String value, String field) {
        if (isBlank(value) || value.trim().length() < MIN_NAME_LENGTH) {
            throw new InvalidClientDataException(field + " must have at least " + MIN_NAME_LENGTH + " characters");
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public Long getId() { return id; }
    public IdentificationType getIdentificationType() { return identificationType; }
    public String getIdentificationNumber() { return identificationNumber; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public LocalDate getBirthDate() { return birthDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
