package com.app.infrastructure.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.app.application.port.in.AccountUseCase;
import com.app.application.port.out.AccountNumberGenerator;
import com.app.application.port.out.AccountRepository;
import com.app.application.port.out.ClientRepository;
import com.app.application.service.AccountService;

@Configuration
public class AccountConfig {

    @Bean
    public AccountUseCase accountUseCase(AccountRepository accountRepository, ClientRepository clientRepository,
                                         AccountNumberGenerator accountNumberGenerator, Clock clock) {
        AccountUseCase accountService =
                new AccountService(accountRepository, clientRepository, accountNumberGenerator, clock);
        return new TransactionalAccountUseCase(accountService);
    }
}
