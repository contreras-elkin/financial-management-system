package com.app.infrastructure.web.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.app.application.port.in.TransactionUseCase;
import com.app.domain.model.Transaction;
import com.app.infrastructure.web.dto.DepositRequest;
import com.app.infrastructure.web.dto.TransactionResponse;
import com.app.infrastructure.web.dto.TransferRequest;
import com.app.infrastructure.web.dto.WithdrawalRequest;

import jakarta.validation.Valid;

// Sin PUT ni DELETE: un movimiento no se edita ni se borra. El estado de cuenta cuelga de la cuenta,
// pero vive aquí para que un solo controller dependa del caso de uso de transacciones.
@RestController
@RequestMapping("/api")
public class TransactionController {

    private final TransactionUseCase transactionUseCase;

    public TransactionController(TransactionUseCase transactionUseCase) {
        this.transactionUseCase = transactionUseCase;
    }

    @PostMapping("/transactions/deposits")
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse deposit(@Valid @RequestBody DepositRequest request) {
        return TransactionResponse.from(transactionUseCase.deposit(request.toCommand()));
    }

    @PostMapping("/transactions/withdrawals")
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse withdraw(@Valid @RequestBody WithdrawalRequest request) {
        return TransactionResponse.from(transactionUseCase.withdraw(request.toCommand()));
    }

    @PostMapping("/transactions/transfers")
    @ResponseStatus(HttpStatus.CREATED)
    public List<TransactionResponse> transfer(@Valid @RequestBody TransferRequest request) {
        return toResponses(transactionUseCase.transfer(request.toCommand()));
    }

    @GetMapping("/accounts/{accountId}/transactions")
    public List<TransactionResponse> findByAccountId(@PathVariable Long accountId) {
        return toResponses(transactionUseCase.findByAccountId(accountId));
    }

    private static List<TransactionResponse> toResponses(List<Transaction> transactions) {
        return transactions.stream()
                .map(TransactionResponse::from)
                .toList();
    }
}
