package com.app.infrastructure.persistence.mapper;

import org.springframework.stereotype.Component;

import com.app.domain.model.Transaction;
import com.app.infrastructure.persistence.entity.TransactionEntity;

@Component
public class TransactionPersistenceMapper {

    public TransactionEntity toEntity(Transaction transaction) {
        return new TransactionEntity(
                transaction.getId(),
                transaction.getAccountId(),
                transaction.getType(),
                transaction.getDirection(),
                transaction.getAmount(),
                transaction.getBalanceAfter(),
                transaction.getCounterpartyAccountId(),
                transaction.getReference(),
                transaction.getCreatedAt());
    }

    public Transaction toDomain(TransactionEntity entity) {
        return Transaction.restore(
                entity.getId(),
                entity.getAccountId(),
                entity.getType(),
                entity.getDirection(),
                entity.getAmount(),
                entity.getBalanceAfter(),
                entity.getCounterpartyAccountId(),
                entity.getReference(),
                entity.getCreatedAt());
    }
}
