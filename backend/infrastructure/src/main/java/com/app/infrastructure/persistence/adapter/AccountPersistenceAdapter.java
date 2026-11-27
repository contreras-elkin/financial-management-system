package com.app.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import com.app.application.port.out.AccountRepository;
import com.app.domain.model.Account;
import com.app.domain.model.AccountStatus;
import com.app.infrastructure.persistence.mapper.AccountPersistenceMapper;
import com.app.infrastructure.persistence.repository.AccountJpaRepository;

@Component
public class AccountPersistenceAdapter implements AccountRepository {

    private final AccountJpaRepository accountJpaRepository;
    private final AccountPersistenceMapper accountPersistenceMapper;

    public AccountPersistenceAdapter(AccountJpaRepository accountJpaRepository,
                                     AccountPersistenceMapper accountPersistenceMapper) {
        this.accountJpaRepository = accountJpaRepository;
        this.accountPersistenceMapper = accountPersistenceMapper;
    }

    @Override
    public Account save(Account account) {
        var saved = accountJpaRepository.save(accountPersistenceMapper.toEntity(account));
        return accountPersistenceMapper.toDomain(saved);
    }

    @Override
    public Optional<Account> findById(Long id) {
        return accountJpaRepository.findById(id)
                .map(accountPersistenceMapper::toDomain);
    }

    @Override
    public Optional<Account> findByIdForUpdate(Long id) {
        return accountJpaRepository.findLockedById(id)
                .map(accountPersistenceMapper::toDomain);
    }

    @Override
    public List<Account> findAll() {
        return accountJpaRepository.findAll(Sort.by("id")).stream()
                .map(accountPersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public List<Account> findByClientId(Long clientId) {
        return accountJpaRepository.findByClientIdOrderByIdAsc(clientId).stream()
                .map(accountPersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public boolean existsByClientId(Long clientId) {
        return accountJpaRepository.existsByClientId(clientId);
    }

    @Override
    public boolean existsOpenGmfExemptAccount(Long clientId) {
        return accountJpaRepository.existsByClientIdAndGmfExemptTrueAndStatusNot(clientId, AccountStatus.CANCELLED);
    }
}
