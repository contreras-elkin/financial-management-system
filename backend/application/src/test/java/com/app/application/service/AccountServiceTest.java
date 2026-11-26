package com.app.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
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

import com.app.application.port.in.CreateAccountCommand;
import com.app.application.port.out.AccountNumberGenerator;
import com.app.application.port.out.AccountRepository;
import com.app.application.port.out.ClientRepository;
import com.app.domain.exception.AccountBalanceNotZeroException;
import com.app.domain.exception.AccountNotFoundException;
import com.app.domain.exception.ClientNotFoundException;
import com.app.domain.exception.GmfExemptionAlreadyAssignedException;
import com.app.domain.exception.InvalidAccountDataException;
import com.app.domain.model.Account;
import com.app.domain.model.AccountStatus;
import com.app.domain.model.AccountType;
import com.app.domain.model.Client;
import com.app.domain.model.IdentificationType;

/**
 * Test unitario del caso de uso: los puertos de salida se reemplazan por mocks (sin base de datos)
 * y el reloj se fija para que las fechas sean deterministas. Las reglas de estado de la cuenta
 * las prueba AccountTest; aquí se prueba la orquestación.
 */
@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    private static final ZoneId ZONE = ZoneId.of("America/Bogota");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 26, 10, 0);
    private static final LocalDateTime CREATED_AT = LocalDateTime.of(2026, 2, 1, 9, 0);
    private static final Long CLIENT_ID = 7L;
    private static final Long ACCOUNT_ID = 1L;
    private static final String SAVINGS_NUMBER = "5300000001";

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private AccountNumberGenerator accountNumberGenerator;

    @Captor
    private ArgumentCaptor<Account> accountCaptor;

    private AccountService accountService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(NOW.atZone(ZONE).toInstant(), ZONE);
        accountService = new AccountService(accountRepository, clientRepository, accountNumberGenerator, fixedClock);
    }

    // ---------- create ----------

    @Test
    void create_withValidData_savesActiveAccountWithGeneratedNumber() {
        when(clientRepository.findById(CLIENT_ID)).thenReturn(Optional.of(client()));
        when(accountNumberGenerator.nextNumber(AccountType.SAVINGS)).thenReturn(SAVINGS_NUMBER);
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> withId(invocation.getArgument(0)));

        Account created = accountService.create(new CreateAccountCommand(CLIENT_ID, AccountType.SAVINGS, false));

        verify(accountRepository).save(accountCaptor.capture());
        Account saved = accountCaptor.getValue();
        assertThat(saved.getId()).isNull();
        assertThat(saved.getNumber()).isEqualTo(SAVINGS_NUMBER);
        assertThat(saved.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(saved.getBalance()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(saved.getClientId()).isEqualTo(CLIENT_ID);
        assertThat(saved.getCreatedAt()).isEqualTo(NOW);
        assertThat(saved.getUpdatedAt()).isEqualTo(NOW);
        assertThat(created.getId()).isEqualTo(ACCOUNT_ID);
    }

    @Test
    void create_notGmfExempt_doesNotCheckOtherExemptAccounts() {
        when(clientRepository.findById(CLIENT_ID)).thenReturn(Optional.of(client()));
        when(accountNumberGenerator.nextNumber(AccountType.SAVINGS)).thenReturn(SAVINGS_NUMBER);
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        accountService.create(new CreateAccountCommand(CLIENT_ID, AccountType.SAVINGS, false));

        verify(accountRepository, never()).existsOpenGmfExemptAccount(any());
    }

    @Test
    void create_gmfExemptWithoutOtherExemptAccount_savesExemptAccount() {
        when(clientRepository.findById(CLIENT_ID)).thenReturn(Optional.of(client()));
        when(accountRepository.existsOpenGmfExemptAccount(CLIENT_ID)).thenReturn(false);
        when(accountNumberGenerator.nextNumber(AccountType.CHECKING)).thenReturn("3300000001");
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Account created = accountService.create(new CreateAccountCommand(CLIENT_ID, AccountType.CHECKING, true));

        assertThat(created.isGmfExempt()).isTrue();
        assertThat(created.getType()).isEqualTo(AccountType.CHECKING);
    }

    @Test
    void create_gmfExemptWhenClientAlreadyHasOne_throwsAndDoesNotGenerateNumber() {
        when(clientRepository.findById(CLIENT_ID)).thenReturn(Optional.of(client()));
        when(accountRepository.existsOpenGmfExemptAccount(CLIENT_ID)).thenReturn(true);

        assertThatThrownBy(() -> accountService.create(new CreateAccountCommand(CLIENT_ID, AccountType.SAVINGS, true)))
                .isInstanceOf(GmfExemptionAlreadyAssignedException.class);
        verifyNoInteractions(accountNumberGenerator);
        verify(accountRepository, never()).save(any());
    }

    @Test
    void create_forMissingClient_throwsAndDoesNotGenerateNumber() {
        when(clientRepository.findById(CLIENT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.create(new CreateAccountCommand(CLIENT_ID, AccountType.SAVINGS, false)))
                .isInstanceOf(ClientNotFoundException.class);
        verifyNoInteractions(accountNumberGenerator);
        verify(accountRepository, never()).save(any());
    }

    @Test
    void create_withoutType_throwsBeforeQueryingAnything() {
        assertThatThrownBy(() -> accountService.create(new CreateAccountCommand(CLIENT_ID, null, false)))
                .isInstanceOf(InvalidAccountDataException.class);
        verifyNoInteractions(clientRepository, accountNumberGenerator, accountRepository);
    }

    @Test
    void create_withoutClient_throwsBeforeQueryingAnything() {
        assertThatThrownBy(() -> accountService.create(new CreateAccountCommand(null, AccountType.SAVINGS, false)))
                .isInstanceOf(InvalidAccountDataException.class);
        verifyNoInteractions(clientRepository, accountNumberGenerator, accountRepository);
    }

    // ---------- queries ----------

    @Test
    void findById_whenExists_returnsAccount() {
        Account account = account(AccountStatus.ACTIVE, BigDecimal.ZERO);
        when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.of(account));

        assertThat(accountService.findById(ACCOUNT_ID)).isSameAs(account);
    }

    @Test
    void findById_whenMissing_throwsNotFound() {
        when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.findById(ACCOUNT_ID))
                .isInstanceOf(AccountNotFoundException.class);
    }

    @Test
    void findAll_returnsAllAccounts() {
        List<Account> accounts = List.of(account(AccountStatus.ACTIVE, BigDecimal.ZERO));
        when(accountRepository.findAll()).thenReturn(accounts);

        assertThat(accountService.findAll()).isEqualTo(accounts);
    }

    @Test
    void findByClientId_returnsClientAccounts() {
        List<Account> accounts = List.of(account(AccountStatus.ACTIVE, BigDecimal.ZERO));
        when(accountRepository.findByClientId(CLIENT_ID)).thenReturn(accounts);

        assertThat(accountService.findByClientId(CLIENT_ID)).isEqualTo(accounts);
    }

    // ---------- status changes ----------

    @Test
    void inactivate_savesAccountWithNewStatusAndDate() {
        when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.of(account(AccountStatus.ACTIVE, BigDecimal.ZERO)));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Account result = accountService.inactivate(ACCOUNT_ID);

        assertThat(result.getStatus()).isEqualTo(AccountStatus.INACTIVE);
        assertThat(result.getUpdatedAt()).isEqualTo(NOW);
    }

    @Test
    void activate_savesAccountWithNewStatus() {
        when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.of(account(AccountStatus.INACTIVE, BigDecimal.ZERO)));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThat(accountService.activate(ACCOUNT_ID).getStatus()).isEqualTo(AccountStatus.ACTIVE);
    }

    @Test
    void cancel_withZeroBalance_savesCancelledAccount() {
        when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.of(account(AccountStatus.ACTIVE, BigDecimal.ZERO)));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThat(accountService.cancel(ACCOUNT_ID).getStatus()).isEqualTo(AccountStatus.CANCELLED);
    }

    @Test
    void cancel_withBalance_throwsAndDoesNotSave() {
        when(accountRepository.findById(ACCOUNT_ID))
                .thenReturn(Optional.of(account(AccountStatus.ACTIVE, new BigDecimal("1500.00"))));

        assertThatThrownBy(() -> accountService.cancel(ACCOUNT_ID))
                .isInstanceOf(AccountBalanceNotZeroException.class);
        verify(accountRepository, never()).save(any());
    }

    @Test
    void changeStatus_ofMissingAccount_throwsNotFound() {
        when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.activate(ACCOUNT_ID))
                .isInstanceOf(AccountNotFoundException.class);
        verify(accountRepository, never()).save(any());
    }

    // ---------- helpers ----------

    private static Client client() {
        return Client.restore(CLIENT_ID, IdentificationType.CC, "100", "Ana", "Gomez", "ana@mail.com",
                LocalDate.of(1990, 5, 10), CREATED_AT, CREATED_AT);
    }

    private static Account account(AccountStatus status, BigDecimal balance) {
        return Account.restore(ACCOUNT_ID, AccountType.SAVINGS, SAVINGS_NUMBER, status, balance, false, CLIENT_ID,
                CREATED_AT, CREATED_AT);
    }

    private static Account withId(Account account) {
        return Account.restore(ACCOUNT_ID, account.getType(), account.getNumber(), account.getStatus(),
                account.getBalance(), account.isGmfExempt(), account.getClientId(), account.getCreatedAt(),
                account.getUpdatedAt());
    }
}
