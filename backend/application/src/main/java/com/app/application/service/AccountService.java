package com.app.application.service;

import com.app.application.port.in.AccountUseCase;
import com.app.application.port.in.CreateAccountCommand;
import com.app.application.port.out.AccountNumberGenerator;
import com.app.application.port.out.AccountRepository;
import com.app.application.port.out.ClientRepository;
import com.app.domain.exception.AccountNotFoundException;
import com.app.domain.exception.ClientNotFoundException;
import com.app.domain.exception.GmfExemptionAlreadyAssignedException;
import com.app.domain.exception.InvalidAccountDataException;
import com.app.domain.model.Account;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.function.BiConsumer;

/**
 * Implementa los casos de uso de cuentas. Orquesta: verifica las reglas que dependen de otros
 * datos (el cliente existe, una sola cuenta exenta de GMF), delega los cambios de estado al dominio
 * y persiste a través de los puertos de salida.
 */
public class AccountService implements AccountUseCase {

    private final AccountRepository accountRepository;
    private final ClientRepository clientRepository;
    private final AccountNumberGenerator accountNumberGenerator;
    private final Clock clock;

    public AccountService(AccountRepository accountRepository, ClientRepository clientRepository,
                          AccountNumberGenerator accountNumberGenerator, Clock clock) {
        this.accountRepository = accountRepository;
        this.clientRepository = clientRepository;
        this.accountNumberGenerator = accountNumberGenerator;
        this.clock = clock;
    }

    /**
     * El número se genera al final, cuando la petición ya pasó todas las verificaciones,
     * para no consumir números en solicitudes que se van a rechazar.
     */
    @Override
    public Account create(CreateAccountCommand command) {
        requireOpeningData(command);
        ensureClientExists(command.clientId());
        if (command.gmfExempt()) {
            ensureNoOtherGmfExemptAccount(command.clientId());
        }
        String number = accountNumberGenerator.nextNumber(command.type());
        Account account = Account.create(command.type(), number, command.clientId(), command.gmfExempt(), now());
        return accountRepository.save(account);
    }

    @Override
    public Account findById(Long id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new AccountNotFoundException(id));
    }

    @Override
    public List<Account> findAll() {
        return accountRepository.findAll();
    }

    @Override
    public List<Account> findByClientId(Long clientId) {
        return accountRepository.findByClientId(clientId);
    }

    @Override
    public Account activate(Long id) {
        return changeStatus(id, Account::activate);
    }

    @Override
    public Account inactivate(Long id) {
        return changeStatus(id, Account::inactivate);
    }

    @Override
    public Account cancel(Long id) {
        return changeStatus(id, Account::cancel);
    }

    /**
     * Los tres cambios de estado siguen el mismo flujo: buscar, delegar la regla al dominio y guardar.
     */
    private Account changeStatus(Long id, BiConsumer<Account, LocalDateTime> transition) {
        Account account = findById(id);
        transition.accept(account, now());
        return accountRepository.save(account);
    }

    /**
     * El dominio también valida estos datos, pero hace falta comprobarlos antes de consultar al
     * cliente o pedir el número. El adaptador web los valida además en el DTO; esta verificación
     * protege el caso de uso frente a cualquier otro adaptador de entrada.
     */
    private static void requireOpeningData(CreateAccountCommand command) {
        if (command.type() == null) {
            throw new InvalidAccountDataException("Account type is required");
        }
        if (command.clientId() == null) {
            throw new InvalidAccountDataException("Client is required");
        }
    }

    /**
     * Una cuenta solo puede existir vinculada a un cliente. La FK de la base de datos lo garantiza también.
     */
    private void ensureClientExists(Long clientId) {
        if (clientRepository.findById(clientId).isEmpty()) {
            throw new ClientNotFoundException(clientId);
        }
    }

    /**
     * La exención del GMF (4x1000) se concede a una sola cuenta por cliente. Las cuentas canceladas
     * no cuentan, de modo que el cliente puede trasladar la exención a una cuenta nueva.
     */
    private void ensureNoOtherGmfExemptAccount(Long clientId) {
        if (accountRepository.existsOpenGmfExemptAccount(clientId)) {
            throw new GmfExemptionAlreadyAssignedException(clientId);
        }
    }

    /**
     * Se trunca a microsegundos, la precisión de TIMESTAMP en PostgreSQL, para que la respuesta
     * coincida con lo que se lee después de la base de datos.
     */
    private LocalDateTime now() {
        return LocalDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
    }
}
