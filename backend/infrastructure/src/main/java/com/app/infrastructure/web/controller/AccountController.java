package com.app.infrastructure.web.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.application.port.in.AccountUseCase;
import com.app.domain.model.Account;
import com.app.infrastructure.web.dto.AccountResponse;
import com.app.infrastructure.web.dto.CreateAccountRequest;

import jakarta.validation.Valid;

/**
 * Sin DELETE: una cuenta se cancela y su registro se conserva.
 * Los cambios de estado son acciones (PATCH /{id}/accion) para que cada regla tenga su endpoint.
 */
@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountUseCase accountUseCase;

    public AccountController(AccountUseCase accountUseCase) {
        this.accountUseCase = accountUseCase;
    }

    @PostMapping
    public ResponseEntity<AccountResponse> create(@Valid @RequestBody CreateAccountRequest request) {
        Account account = accountUseCase.create(request.toCommand());
        return ResponseEntity
                .created(URI.create("/api/accounts/" + account.getId()))
                .body(AccountResponse.from(account));
    }

    @GetMapping("/{id}")
    public AccountResponse findById(@PathVariable Long id) {
        return AccountResponse.from(accountUseCase.findById(id));
    }

    @GetMapping
    public List<AccountResponse> findAll(@RequestParam(required = false) Long clientId) {
        List<Account> accounts = clientId == null
                ? accountUseCase.findAll()
                : accountUseCase.findByClientId(clientId);
        return accounts.stream()
                .map(AccountResponse::from)
                .toList();
    }

    @PatchMapping("/{id}/activate")
    public AccountResponse activate(@PathVariable Long id) {
        return AccountResponse.from(accountUseCase.activate(id));
    }

    @PatchMapping("/{id}/inactivate")
    public AccountResponse inactivate(@PathVariable Long id) {
        return AccountResponse.from(accountUseCase.inactivate(id));
    }

    @PatchMapping("/{id}/cancel")
    public AccountResponse cancel(@PathVariable Long id) {
        return AccountResponse.from(accountUseCase.cancel(id));
    }
}
