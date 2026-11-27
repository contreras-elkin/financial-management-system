package com.app.application.port.in;

import com.app.domain.model.Transaction;

import java.util.List;

// No hay edición ni borrado: un movimiento erróneo se corrige con otro en sentido contrario.
public interface TransactionUseCase {

    Transaction deposit(DepositCommand command);

    Transaction withdraw(WithdrawalCommand command);

    // Devuelve el débito de la cuenta origen y el crédito de la cuenta destino.
    List<Transaction> transfer(TransferCommand command);

    // Estado de cuenta: los movimientos de la cuenta, del más reciente al más antiguo.
    List<Transaction> findByAccountId(Long accountId);
}
