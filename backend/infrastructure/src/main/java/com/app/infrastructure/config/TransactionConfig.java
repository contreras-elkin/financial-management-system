package com.app.infrastructure.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.app.application.port.in.TransactionUseCase;
import com.app.application.port.out.AccountRepository;
import com.app.application.port.out.TransactionRepository;
import com.app.application.service.TransactionService;

@Configuration
public class TransactionConfig {

    @Bean
    public TransactionUseCase transactionUseCase(TransactionRepository transactionRepository,
                                                 AccountRepository accountRepository, Clock clock) {
        TransactionUseCase transactionService = new TransactionService(transactionRepository, accountRepository, clock);
        return new TransactionalTransactionUseCase(transactionService);
    }
}
