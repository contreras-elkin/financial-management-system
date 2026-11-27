package com.app.infrastructure.config;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

import com.app.application.port.in.DepositCommand;
import com.app.application.port.in.TransactionUseCase;
import com.app.application.port.in.TransferCommand;
import com.app.application.port.in.WithdrawalCommand;
import com.app.domain.model.Transaction;

// Cada operación es una transacción de BD: los saldos y los movimientos se guardan todos o ninguno,
// y el bloqueo de las cuentas dura hasta el commit o el rollback.
public class TransactionalTransactionUseCase implements TransactionUseCase {

    private final TransactionUseCase delegate;

    public TransactionalTransactionUseCase(TransactionUseCase delegate) {
        this.delegate = delegate;
    }

    @Transactional
    @Override
    public Transaction deposit(DepositCommand command) {
        return delegate.deposit(command);
    }

    @Transactional
    @Override
    public Transaction withdraw(WithdrawalCommand command) {
        return delegate.withdraw(command);
    }

    @Transactional
    @Override
    public List<Transaction> transfer(TransferCommand command) {
        return delegate.transfer(command);
    }

    @Transactional(readOnly = true)
    @Override
    public List<Transaction> findByAccountId(Long accountId) {
        return delegate.findByAccountId(accountId);
    }
}
