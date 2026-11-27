package com.app.infrastructure.persistence.mapper;

import org.springframework.stereotype.Component;

import com.app.domain.model.Account;
import com.app.infrastructure.persistence.entity.AccountEntity;

@Component
public class AccountPersistenceMapper {

    public AccountEntity toEntity(Account account) {
        return new AccountEntity(
                account.getId(),
                account.getType(),
                account.getNumber(),
                account.getStatus(),
                account.getBalance(),
                account.getOverdraftLimit(),
                account.isGmfExempt(),
                account.getClientId(),
                account.getCreatedAt(),
                account.getUpdatedAt());
    }

    public Account toDomain(AccountEntity entity) {
        return Account.restore(
                entity.getId(),
                entity.getType(),
                entity.getNumber(),
                entity.getStatus(),
                entity.getBalance(),
                entity.getOverdraftLimit(),
                entity.isGmfExempt(),
                entity.getClientId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }
}
