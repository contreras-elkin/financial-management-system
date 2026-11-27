package com.app.infrastructure.persistence.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.app.domain.model.AccountStatus;
import com.app.infrastructure.persistence.entity.AccountEntity;

public interface AccountJpaRepository extends JpaRepository<AccountEntity, Long> {

    List<AccountEntity> findByClientIdOrderByIdAsc(Long clientId);

    boolean existsByClientId(Long clientId);

    boolean existsByClientIdAndGmfExemptTrueAndStatusNot(Long clientId, AccountStatus status);
}
