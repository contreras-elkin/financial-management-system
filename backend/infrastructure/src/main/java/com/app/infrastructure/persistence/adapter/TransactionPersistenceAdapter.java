package com.app.infrastructure.persistence.adapter;

import java.util.List;

import org.springframework.stereotype.Component;

import com.app.application.port.out.TransactionRepository;
import com.app.domain.model.Transaction;
import com.app.infrastructure.persistence.mapper.TransactionPersistenceMapper;
import com.app.infrastructure.persistence.repository.TransactionJpaRepository;

@Component
public class TransactionPersistenceAdapter implements TransactionRepository {

    private final TransactionJpaRepository transactionJpaRepository;
    private final TransactionPersistenceMapper transactionPersistenceMapper;

    public TransactionPersistenceAdapter(TransactionJpaRepository transactionJpaRepository,
                                         TransactionPersistenceMapper transactionPersistenceMapper) {
        this.transactionJpaRepository = transactionJpaRepository;
        this.transactionPersistenceMapper = transactionPersistenceMapper;
    }

    @Override
    public Transaction save(Transaction transaction) {
        var saved = transactionJpaRepository.save(transactionPersistenceMapper.toEntity(transaction));
        return transactionPersistenceMapper.toDomain(saved);
    }

    @Override
    public List<Transaction> findByAccountId(Long accountId) {
        return transactionJpaRepository.findByAccountIdOrderByCreatedAtDescIdDesc(accountId).stream()
                .map(transactionPersistenceMapper::toDomain)
                .toList();
    }
}
