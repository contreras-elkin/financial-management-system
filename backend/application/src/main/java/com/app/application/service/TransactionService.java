package com.app.application.service;

import com.app.application.port.in.DepositCommand;
import com.app.application.port.in.TransactionUseCase;
import com.app.application.port.in.TransferCommand;
import com.app.application.port.in.WithdrawalCommand;
import com.app.application.port.out.AccountRepository;
import com.app.application.port.out.TransactionRepository;
import com.app.domain.exception.AccountNotFoundException;
import com.app.domain.exception.InvalidTransactionDataException;
import com.app.domain.model.Account;
import com.app.domain.model.Transaction;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

public class TransactionService implements TransactionUseCase {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final Clock clock;

    public TransactionService(TransactionRepository transactionRepository, AccountRepository accountRepository,
                              Clock clock) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.clock = clock;
    }

    @Override
    public Transaction deposit(DepositCommand command) {
        Account account = lockAccount(requireAccountId(command.accountId()));
        Transaction transaction = account.deposit(command.amount(), now());
        accountRepository.save(account);
        return transactionRepository.save(transaction);
    }

    @Override
    public Transaction withdraw(WithdrawalCommand command) {
        Account account = lockAccount(requireAccountId(command.accountId()));
        Transaction transaction = account.withdraw(command.amount(), now());
        accountRepository.save(account);
        return transactionRepository.save(transaction);
    }

    // Las cuentas se bloquean siempre en orden de id: si dos transferencias cruzadas (A→B y B→A)
    // bloquearan cada una primero su origen, se esperarían mutuamente (deadlock).
    @Override
    public List<Transaction> transfer(TransferCommand command) {
        Long sourceId = requireAccountId(command.sourceAccountId());
        Long targetId = requireAccountId(command.targetAccountId());
        if (sourceId.equals(targetId)) {
            throw new InvalidTransactionDataException("Cannot transfer to the same account");
        }
        Account first = lockAccount(Math.min(sourceId, targetId));
        Account second = lockAccount(Math.max(sourceId, targetId));
        Account source = first.getId().equals(sourceId) ? first : second;
        Account target = source == first ? second : first;

        List<Transaction> transactions = source.transferTo(target, command.amount(), now());
        accountRepository.save(source);
        accountRepository.save(target);
        return transactions.stream()
                .map(transactionRepository::save)
                .toList();
    }

    @Override
    public List<Transaction> findByAccountId(Long accountId) {
        if (accountRepository.findById(accountId).isEmpty()) {
            throw new AccountNotFoundException(accountId);
        }
        return transactionRepository.findByAccountId(accountId);
    }

    private Account lockAccount(Long id) {
        return accountRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new AccountNotFoundException(id));
    }

    // El adaptador web también lo valida; esto protege el caso de uso frente a otros adaptadores.
    private static Long requireAccountId(Long accountId) {
        if (accountId == null) {
            throw new InvalidTransactionDataException("Account is required");
        }
        return accountId;
    }

    // Truncado a microsegundos, la precisión de TIMESTAMP en PostgreSQL.
    private LocalDateTime now() {
        return LocalDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
    }
}
