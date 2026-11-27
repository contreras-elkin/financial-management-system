package com.app.infrastructure.persistence.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.app.infrastructure.persistence.entity.TransactionEntity;

public interface TransactionJpaRepository extends JpaRepository<TransactionEntity, Long> {

    // El id desempata los dos movimientos de una transferencia, que comparten fecha.
    List<TransactionEntity> findByAccountIdOrderByCreatedAtDescIdDesc(Long accountId);
}
