package com.app.application.port.out;

import com.app.domain.model.Transaction;

import java.util.List;

public interface TransactionRepository {

    Transaction save(Transaction transaction);

    // Del más reciente al más antiguo.
    List<Transaction> findByAccountId(Long accountId);
}
