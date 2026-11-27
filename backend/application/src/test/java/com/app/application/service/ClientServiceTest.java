package com.app.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.app.application.port.in.CreateClientCommand;
import com.app.application.port.in.UpdateClientCommand;
import com.app.application.port.out.AccountRepository;
import com.app.application.port.out.ClientRepository;
import com.app.domain.exception.ClientHasProductsException;
import com.app.domain.exception.ClientNotFoundException;
import com.app.domain.exception.DuplicateClientException;
import com.app.domain.exception.UnderageClientException;
import com.app.domain.model.Client;
import com.app.domain.model.IdentificationType;

/**
 * Test unitario del caso de uso: los puertos de salida se reemplazan por mocks (sin base de datos)
 * y el reloj se fija para que las fechas sean deterministas.
 */
@ExtendWith(MockitoExtension.class)
class ClientServiceTest {

    private static final ZoneId ZONE = ZoneId.of("America/Bogota");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 24, 10, 0);
    private static final LocalDateTime CREATED_AT = LocalDateTime.of(2026, 1, 15, 8, 30);

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private AccountRepository accountRepository;

    @Captor
    private ArgumentCaptor<Client> clientCaptor;

    private ClientService clientService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(NOW.atZone(ZONE).toInstant(), ZONE);
        clientService = new ClientService(clientRepository, accountRepository, fixedClock);
    }

    // ---------- create ----------

    @Test
    void create_withValidData_savesClientWithSystemDates() {
        when(clientRepository.findByIdentification(IdentificationType.CC, "100")).thenReturn(Optional.empty());
        when(clientRepository.save(any(Client.class))).thenAnswer(invocation -> withId(invocation.getArgument(0), 1L));

        Client created = clientService.create(createCommand("100", LocalDate.of(1990, 5, 10)));

        verify(clientRepository).save(clientCaptor.capture());
        Client saved = clientCaptor.getValue();
        assertThat(saved.getId()).isNull();
        assertThat(saved.getCreatedAt()).isEqualTo(NOW);
        assertThat(saved.getUpdatedAt()).isEqualTo(NOW);
        assertThat(created.getId()).isEqualTo(1L);
        assertThat(created.getFirstName()).isEqualTo("Ana");
    }

    @Test
    void create_withExistingIdentification_throwsDuplicateAndDoesNotSave() {
        when(clientRepository.findByIdentification(IdentificationType.CC, "100"))
                .thenReturn(Optional.of(existingClient(1L)));

        assertThatThrownBy(() -> clientService.create(createCommand("100", LocalDate.of(1990, 5, 10))))
                .isInstanceOf(DuplicateClientException.class);

        verify(clientRepository, never()).save(any());
    }

    @Test
    void create_withUnderageClient_throwsBeforeTouchingRepository() {
        LocalDate seventeenYearsOld = NOW.toLocalDate().minusYears(17);

        assertThatThrownBy(() -> clientService.create(createCommand("100", seventeenYearsOld)))
                .isInstanceOf(UnderageClientException.class);

        verifyNoInteractions(clientRepository);
    }

    // ---------- find ----------

    @Test
    void findById_whenClientExists_returnsIt() {
        Client existing = existingClient(1L);
        when(clientRepository.findById(1L)).thenReturn(Optional.of(existing));

        assertThat(clientService.findById(1L)).isSameAs(existing);
    }

    @Test
    void findById_whenClientDoesNotExist_throwsNotFound() {
        when(clientRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> clientService.findById(99L))
                .isInstanceOf(ClientNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void findAll_returnsAllClientsFromRepository() {
        List<Client> clients = List.of(existingClient(1L), existingClient(2L));
        when(clientRepository.findAll()).thenReturn(clients);

        assertThat(clientService.findAll()).containsExactlyElementsOf(clients);
    }

    // ---------- update ----------

    @Test
    void update_whenClientExists_updatesPersonalDataAndModificationDate() {
        when(clientRepository.findById(1L)).thenReturn(Optional.of(existingClient(1L)));
        when(clientRepository.save(any(Client.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Client updated = clientService.update(1L,
                new UpdateClientCommand("Ana Maria", "Ruiz", "ana.m@mail.com", LocalDate.of(1990, 5, 10)));

        assertThat(updated.getFirstName()).isEqualTo("Ana Maria");
        assertThat(updated.getEmail()).isEqualTo("ana.m@mail.com");
        assertThat(updated.getUpdatedAt()).isEqualTo(NOW);
        assertThat(updated.getCreatedAt()).isEqualTo(CREATED_AT);
        assertThat(updated.getIdentificationNumber()).isEqualTo("100");
        verify(clientRepository).save(updated);
    }

    @Test
    void update_whenClientDoesNotExist_throwsNotFoundAndDoesNotSave() {
        when(clientRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> clientService.update(99L,
                new UpdateClientCommand("Ana", "Ruiz", "ana@mail.com", LocalDate.of(1990, 5, 10))))
                .isInstanceOf(ClientNotFoundException.class);

        verify(clientRepository, never()).save(any());
    }

    // ---------- delete ----------

    @Test
    void delete_whenClientHasNoAccounts_deletesIt() {
        when(clientRepository.findById(1L)).thenReturn(Optional.of(existingClient(1L)));
        when(accountRepository.existsByClientId(1L)).thenReturn(false);

        clientService.delete(1L);

        verify(clientRepository).deleteById(1L);
    }

    @Test
    void delete_whenClientDoesNotExist_throwsNotFoundAndDoesNotDelete() {
        when(clientRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> clientService.delete(99L))
                .isInstanceOf(ClientNotFoundException.class);

        verify(clientRepository, never()).deleteById(any());
    }

    @Test
    void delete_whenClientHasAccounts_throwsAndDoesNotDelete() {
        when(clientRepository.findById(1L)).thenReturn(Optional.of(existingClient(1L)));
        when(accountRepository.existsByClientId(1L)).thenReturn(true);

        assertThatThrownBy(() -> clientService.delete(1L))
                .isInstanceOf(ClientHasProductsException.class);

        verify(clientRepository, never()).deleteById(any());
    }

    // ---------- helpers ----------

    private static CreateClientCommand createCommand(String identificationNumber, LocalDate birthDate) {
        return new CreateClientCommand(IdentificationType.CC, identificationNumber,
                "Ana", "Ruiz", "ana@mail.com", birthDate);
    }

    private static Client existingClient(Long id) {
        return Client.restore(id, IdentificationType.CC, "100", "Ana", "Ruiz", "ana@mail.com",
                LocalDate.of(1990, 5, 10), CREATED_AT, CREATED_AT);
    }

    /** Simula lo que hace la base de datos al guardar: asignar el id generado. */
    private static Client withId(Client client, Long id) {
        return Client.restore(id, client.getIdentificationType(), client.getIdentificationNumber(),
                client.getFirstName(), client.getLastName(), client.getEmail(), client.getBirthDate(),
                client.getCreatedAt(), client.getUpdatedAt());
    }
}
