package com.app.infrastructure.web.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.app.application.port.in.ClientUseCase;
import com.app.application.port.in.CreateClientCommand;
import com.app.application.port.in.UpdateClientCommand;
import com.app.domain.exception.ClientHasProductsException;
import com.app.domain.exception.ClientNotFoundException;
import com.app.domain.exception.DuplicateClientException;
import com.app.domain.exception.UnderageClientException;
import com.app.domain.model.Client;
import com.app.domain.model.IdentificationType;

/**
 * Test unitario de la capa web: solo se levanta Spring MVC (controller, validación, JSON y el
 * GlobalExceptionHandler). El caso de uso es un mock, así que no hay lógica de negocio ni base de datos.
 * Se verifica la traducción HTTP: rutas, códigos de estado, headers y cuerpo.
 */
@WebMvcTest(ClientController.class)
class ClientControllerTest {

    private static final String BASE_URL = "/api/clients";
    private static final LocalDateTime CREATED_AT = LocalDateTime.of(2026, 11, 24, 10, 0, 0);

    private static final String VALID_CREATE_BODY = """
            {
              "identificationType": "CC",
              "identificationNumber": "100",
              "firstName": "Ana",
              "lastName": "Ruiz",
              "email": "ana@mail.com",
              "birthDate": "1990-05-10"
            }
            """;

    private static final String VALID_UPDATE_BODY = """
            {
              "firstName": "Ana Maria",
              "lastName": "Ruiz",
              "email": "ana.m@mail.com",
              "birthDate": "1990-05-10"
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ClientUseCase clientUseCase;

    // ---------- POST /api/clients ----------

    @Test
    void create_withValidBody_returns201WithLocationAndClient() throws Exception {
        when(clientUseCase.create(any())).thenReturn(client(1L, "Ana"));

        mockMvc.perform(post(BASE_URL).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE_BODY))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/clients/1"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.identificationType").value("CC"))
                .andExpect(jsonPath("$.firstName").value("Ana"))
                .andExpect(jsonPath("$.birthDate").value("1990-05-10"))
                .andExpect(jsonPath("$.createdAt").value("2026-11-24T10:00:00"));

        ArgumentCaptor<CreateClientCommand> captor = ArgumentCaptor.forClass(CreateClientCommand.class);
        verify(clientUseCase).create(captor.capture());
        assertThat(captor.getValue().identificationNumber()).isEqualTo("100");
        assertThat(captor.getValue().birthDate()).isEqualTo(LocalDate.of(1990, 5, 10));
    }

    @Test
    void create_withInvalidFields_returns400WithFieldErrorsAndDoesNotCallUseCase() throws Exception {
        String body = """
                {
                  "identificationType": "CC",
                  "identificationNumber": "",
                  "firstName": "A",
                  "lastName": "Ruiz",
                  "email": "ana@mail.com"
                }
                """;

        mockMvc.perform(post(BASE_URL).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid request"))
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors.identificationNumber").exists())
                .andExpect(jsonPath("$.errors.firstName").exists())
                .andExpect(jsonPath("$.errors.birthDate").exists());

        verifyNoInteractions(clientUseCase);
    }

    @Test
    void create_withUnknownIdentificationType_returns400() throws Exception {
        String body = VALID_CREATE_BODY.replace("\"CC\"", "\"XX\"");

        mockMvc.perform(post(BASE_URL).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(clientUseCase);
    }

    @Test
    void create_whenClientIsDuplicated_returns409() throws Exception {
        when(clientUseCase.create(any())).thenThrow(new DuplicateClientException(IdentificationType.CC, "100"));

        mockMvc.perform(post(BASE_URL).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Conflict with current state"))
                .andExpect(jsonPath("$.code").value("CLIENT_ALREADY_EXISTS"));
    }

    @Test
    void create_whenDatabaseConstraintFails_returns409WithoutDatabaseDetails() throws Exception {
        when(clientUseCase.create(any()))
                .thenThrow(new DataIntegrityViolationException("duplicate key value violates unique constraint"));

        mockMvc.perform(post(BASE_URL).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DATA_INTEGRITY_VIOLATION"))
                .andExpect(jsonPath("$.detail").value("The request conflicts with the current state of the data"));
    }

    @Test
    void create_whenBusinessRuleFails_returns400() throws Exception {
        when(clientUseCase.create(any())).thenThrow(new UnderageClientException());

        mockMvc.perform(post(BASE_URL).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Business rule violated"))
                .andExpect(jsonPath("$.code").value("CLIENT_UNDERAGE"))
                .andExpect(jsonPath("$.detail").value("The client must be of legal age"));
    }

    // ---------- GET ----------

    @Test
    void findById_whenClientExists_returns200() throws Exception {
        when(clientUseCase.findById(1L)).thenReturn(client(1L, "Ana"));

        mockMvc.perform(get(BASE_URL + "/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("ana@mail.com"));
    }

    @Test
    void findById_whenClientDoesNotExist_returns404() throws Exception {
        when(clientUseCase.findById(99L)).thenThrow(new ClientNotFoundException(99L));

        mockMvc.perform(get(BASE_URL + "/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource not found"))
                .andExpect(jsonPath("$.code").value("CLIENT_NOT_FOUND"));
    }

    @Test
    void findAll_returns200WithAllClients() throws Exception {
        when(clientUseCase.findAll()).thenReturn(List.of(client(1L, "Ana"), client(2L, "Luis")));

        mockMvc.perform(get(BASE_URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].firstName").value("Luis"));
    }

    // ---------- PUT /api/clients/{id} ----------

    @Test
    void update_withValidBody_returns200WithUpdatedClient() throws Exception {
        when(clientUseCase.update(eq(1L), any())).thenReturn(client(1L, "Ana Maria"));

        mockMvc.perform(put(BASE_URL + "/1").contentType(MediaType.APPLICATION_JSON).content(VALID_UPDATE_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Ana Maria"));

        ArgumentCaptor<UpdateClientCommand> captor = ArgumentCaptor.forClass(UpdateClientCommand.class);
        verify(clientUseCase).update(eq(1L), captor.capture());
        assertThat(captor.getValue().email()).isEqualTo("ana.m@mail.com");
    }

    @Test
    void update_withInvalidBody_returns400AndDoesNotCallUseCase() throws Exception {
        String body = VALID_UPDATE_BODY.replace("\"Ana Maria\"", "\"A\"");

        mockMvc.perform(put(BASE_URL + "/1").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.firstName").exists());

        verifyNoInteractions(clientUseCase);
    }

    // ---------- DELETE /api/clients/{id} ----------

    @Test
    void delete_whenClientExists_returns204() throws Exception {
        mockMvc.perform(delete(BASE_URL + "/1"))
                .andExpect(status().isNoContent());

        verify(clientUseCase).delete(1L);
    }

    @Test
    void delete_whenClientDoesNotExist_returns404() throws Exception {
        doThrow(new ClientNotFoundException(99L)).when(clientUseCase).delete(99L);

        mockMvc.perform(delete(BASE_URL + "/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_whenClientHasProducts_returns409() throws Exception {
        doThrow(new ClientHasProductsException(1L)).when(clientUseCase).delete(1L);

        mockMvc.perform(delete(BASE_URL + "/1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CLIENT_HAS_PRODUCTS"));
    }

    // ---------- helpers ----------

    private static Client client(Long id, String firstName) {
        return Client.restore(id, IdentificationType.CC, "100", firstName, "Ruiz", "ana@mail.com",
                LocalDate.of(1990, 5, 10), CREATED_AT, CREATED_AT);
    }
}
