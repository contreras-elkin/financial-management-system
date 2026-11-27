package com.app.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doCallRealMethod;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadLocalRandom;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import com.app.application.port.in.AccountUseCase;
import com.app.application.port.in.ClientUseCase;
import com.app.application.port.in.CreateAccountCommand;
import com.app.application.port.in.CreateClientCommand;
import com.app.application.port.in.DepositCommand;
import com.app.application.port.in.TransactionUseCase;
import com.app.application.port.in.TransferCommand;
import com.app.application.port.in.WithdrawalCommand;
import com.app.application.port.out.TransactionRepository;
import com.app.domain.exception.InsufficientFundsException;
import com.app.domain.model.AccountType;
import com.app.domain.model.IdentificationType;

// La app completa contra PostgreSQL real (con las migraciones de Flyway): prueba lo que los tests
// con mocks no pueden, el rollback de la transacción de BD y los bloqueos entre peticiones concurrentes.
@SpringBootTest
@Testcontainers
class TransactionAcidIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17");

    @Autowired
    private TransactionUseCase transactionUseCase;

    @Autowired
    private AccountUseCase accountUseCase;

    @Autowired
    private ClientUseCase clientUseCase;

    @MockitoSpyBean
    private TransactionRepository transactionRepository;

    @Test
    void transfer_whenFailingAfterDebitIsWritten_rollsBackBothAccounts() {
        Long clientId = newClient();
        Long source = newAccount(clientId, AccountType.SAVINGS);
        Long target = newAccount(clientId, AccountType.CHECKING);
        transactionUseCase.deposit(new DepositCommand(source, new BigDecimal("100000.00")));

        // El débito se inserta de verdad (IDENTITY obliga a hacer el INSERT al guardar);
        // la falla llega al guardar el crédito, cuando la transacción ya escribió en la BD.
        doCallRealMethod()
                .doThrow(new IllegalStateException("Simulated failure after the debit"))
                .when(transactionRepository).save(any());

        assertThatThrownBy(() -> transactionUseCase.transfer(
                new TransferCommand(source, target, new BigDecimal("40000.00"))))
                .isInstanceOf(IllegalStateException.class);

        assertThat(accountUseCase.findById(source).getBalance()).isEqualByComparingTo("100000.00");
        assertThat(accountUseCase.findById(target).getBalance()).isEqualByComparingTo("0.00");
        assertThat(transactionUseCase.findByAccountId(source)).hasSize(1);
        assertThat(transactionUseCase.findByAccountId(target)).isEmpty();
    }

    @Test
    void concurrentWithdrawals_neverLoseAnUpdateNorOverdrawSavings() throws Exception {
        Long account = newAccount(newClient(), AccountType.SAVINGS);
        transactionUseCase.deposit(new DepositCommand(account, new BigDecimal("60000.00")));

        List<Boolean> results = runConcurrently(40, i -> {
            try {
                transactionUseCase.withdraw(new WithdrawalCommand(account, new BigDecimal("2000.00")));
                return true;
            } catch (InsufficientFundsException e) {
                return false;
            }
        });

        assertThat(results).filteredOn(ok -> ok).hasSize(30);
        assertThat(results).filteredOn(ok -> !ok).hasSize(10);
        assertThat(accountUseCase.findById(account).getBalance()).isEqualByComparingTo("0.00");
    }

    @Test
    void concurrentCrossedTransfers_completeWithoutDeadlockAndKeepTheTotal() throws Exception {
        Long clientId = newClient();
        Long first = newAccount(clientId, AccountType.SAVINGS);
        Long second = newAccount(clientId, AccountType.CHECKING);
        transactionUseCase.deposit(new DepositCommand(first, new BigDecimal("10000.00")));
        transactionUseCase.deposit(new DepositCommand(second, new BigDecimal("10000.00")));

        List<Boolean> results = runConcurrently(40, i -> {
            Long from = i % 2 == 0 ? first : second;
            Long to = i % 2 == 0 ? second : first;
            transactionUseCase.transfer(new TransferCommand(from, to, new BigDecimal("100.00")));
            return true;
        });

        assertThat(results).hasSize(40).containsOnly(true);
        BigDecimal total = accountUseCase.findById(first).getBalance()
                .add(accountUseCase.findById(second).getBalance());
        assertThat(total).isEqualByComparingTo("20000.00");
    }

    // ---------- helpers ----------

    // El latch hace que todas las tareas arranquen a la vez, para que compitan por la misma fila.
    private static List<Boolean> runConcurrently(int tasks, IndexedTask task) throws Exception {
        CountDownLatch start = new CountDownLatch(1);
        try (ExecutorService executor = Executors.newFixedThreadPool(tasks)) {
            List<Future<Boolean>> futures = new ArrayList<>();
            for (int i = 0; i < tasks; i++) {
                int index = i;
                Callable<Boolean> callable = () -> {
                    start.await();
                    return task.run(index);
                };
                futures.add(executor.submit(callable));
            }
            start.countDown();
            List<Boolean> results = new ArrayList<>();
            for (Future<Boolean> future : futures) {
                results.add(future.get());
            }
            return results;
        }
    }

    @FunctionalInterface
    private interface IndexedTask {
        boolean run(int index) throws Exception;
    }

    private Long newClient() {
        String identification = String.valueOf(ThreadLocalRandom.current().nextLong(100_000_000L, 999_999_999L));
        return clientUseCase.create(new CreateClientCommand(IdentificationType.CC, identification, "Ana", "Gomez",
                "ana@mail.com", LocalDate.of(1990, 5, 10))).getId();
    }

    private Long newAccount(Long clientId, AccountType type) {
        return accountUseCase.create(new CreateAccountCommand(clientId, type, false)).getId();
    }
}
