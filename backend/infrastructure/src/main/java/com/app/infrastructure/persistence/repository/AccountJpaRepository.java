package com.app.infrastructure.persistence.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import com.app.domain.model.AccountStatus;
import com.app.infrastructure.persistence.entity.AccountEntity;

import jakarta.persistence.LockModeType;

public interface AccountJpaRepository extends JpaRepository<AccountEntity, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<AccountEntity> findLockedById(Long id);

    List<AccountEntity> findByClientIdOrderByIdAsc(Long clientId);

    boolean existsByClientId(Long clientId);

    boolean existsByClientIdAndGmfExemptTrueAndStatusNot(Long clientId, AccountStatus status);
}
