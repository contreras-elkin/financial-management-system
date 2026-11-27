package com.app.infrastructure.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.app.application.port.in.ClientUseCase;
import com.app.application.port.out.AccountRepository;
import com.app.application.port.out.ClientRepository;
import com.app.application.service.ClientService;

@Configuration
public class ClientConfig {

    @Bean
    public ClientUseCase clientUseCase(ClientRepository clientRepository, AccountRepository accountRepository,
                                       Clock clock) {
        ClientUseCase clientService = new ClientService(clientRepository, accountRepository, clock);
        return new TransactionalClientUseCase(clientService);
    }
}
