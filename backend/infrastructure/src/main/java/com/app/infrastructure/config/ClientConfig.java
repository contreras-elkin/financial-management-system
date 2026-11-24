package com.app.infrastructure.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.app.application.port.in.ClientUseCase;
import com.app.application.port.out.ClientRepository;
import com.app.application.service.ClientService;

/**
 * Composition root de clientes: ensambla el caso de uso con su adaptador de persistencia
 * y lo envuelve en el decorador transaccional. Es el único ClientUseCase del contexto.
 */
@Configuration
public class ClientConfig {

    @Bean
    public ClientUseCase clientUseCase(ClientRepository clientRepository, Clock clock) {
        ClientUseCase clientService = new ClientService(clientRepository, clock);
        return new TransactionalClientUseCase(clientService);
    }
}
