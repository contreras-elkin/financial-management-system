package com.app.infrastructure.web.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.application.port.in.ClientUseCase;
import com.app.domain.model.Client;
import com.app.infrastructure.web.dto.ClientResponse;
import com.app.infrastructure.web.dto.CreateClientRequest;
import com.app.infrastructure.web.dto.UpdateClientRequest;

import jakarta.validation.Valid;

/**
 * Adaptador de entrada REST: traduce HTTP a comandos del caso de uso y el resultado a JSON.
 */
@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientUseCase clientUseCase;

    public ClientController(ClientUseCase clientUseCase) {
        this.clientUseCase = clientUseCase;
    }

    @PostMapping
    public ResponseEntity<ClientResponse> create(@Valid @RequestBody CreateClientRequest request) {
        Client client = clientUseCase.create(request.toCommand());
        return ResponseEntity
                .created(URI.create("/api/clients/" + client.getId()))
                .body(ClientResponse.from(client));
    }

    @GetMapping("/{id}")
    public ClientResponse findById(@PathVariable Long id) {
        return ClientResponse.from(clientUseCase.findById(id));
    }

    @GetMapping
    public List<ClientResponse> findAll() {
        return clientUseCase.findAll().stream()
                .map(ClientResponse::from)
                .toList();
    }

    @PutMapping("/{id}")
    public ClientResponse update(@PathVariable Long id, @Valid @RequestBody UpdateClientRequest request) {
        return ClientResponse.from(clientUseCase.update(id, request.toCommand()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        clientUseCase.delete(id);
        return ResponseEntity.noContent().build();
    }
}
