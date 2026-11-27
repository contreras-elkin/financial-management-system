package com.app.infrastructure.web.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.app.application.port.in.DepositCommand;
import com.app.application.port.in.TransactionUseCase;
import com.app.application.port.in.TransferCommand;
import com.app.application.port.in.WithdrawalCommand;
import com.app.domain.exception.AccountNotActiveException;
import com.app.domain.exception.AccountNotFoundException;
import com.app.domain.exception.InsufficientFundsException;
import com.app.domain.exception.InvalidTransactionDataException;
import com.app.domain.model.Transaction;
import com.app.domain.model.TransactionDirection;
import com.app.domain.model.TransactionType;

// Prueba la traducción HTTP; las reglas de negocio las prueban el dominio y el service.
@WebMvcTest(TransactionController.class)
class TransactionControllerTest {

    private static final LocalDateTime CREATED_AT = LocalDateTime.of(2026, 11, 27, 10, 0);
    private static final UUID REFERENCE = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TransactionUseCase transactionUseCase;

    // ---------- POST /api/transactions/deposits ----------

    @Test
    void deposit_withValidBody_returns201WithTransaction() throws Exception {
        when(transactionUseCase.deposit(any())).thenReturn(deposit());

        mockMvc.perform(post("/api/transactions/deposits").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"accountId": 1, "amount": 50.00}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.accountId").value(1))
                .andExpect(jsonPath("$.type").value("DEPOSIT"))
                .andExpect(jsonPath("$.direction").value("CREDIT"))
                .andExpect(jsonPath("$.amount").value(50.00))
                .andExpect(jsonPath("$.balanceAfter").value(150.00))
                .andExpect(jsonPath("$.reference").value(REFERENCE.toString()));

        ArgumentCaptor<DepositCommand> captor = ArgumentCaptor.forClass(DepositCommand.class);
        verify(transactionUseCase).deposit(captor.capture());
        assertThat(captor.getValue()).isEqualTo(new DepositCommand(1L, new BigDecimal("50.00")));
    }

    @Test
    void deposit_withEmptyBody_returns400WithEachMissingFieldAndDoesNotCallUseCase() throws Exception {
        mockMvc.perform(post("/api/transactions/deposits").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors.accountId").exists())
                .andExpect(jsonPath("$.errors.amount").exists());

        verifyNoInteractions(transactionUseCase);
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-10.00", "10.001"})
    void deposit_withInvalidAmount_returns400(String amount) throws Exception {
        mockMvc.perform(post("/api/transactions/deposits").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accountId\": 1, \"amount\": " + amount + "}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors.amount").exists());

        verifyNoInteractions(transactionUseCase);
    }

    @Test
    void deposit_whenAccountDoesNotExist_returns404() throws Exception {
        when(transactionUseCase.deposit(any())).thenThrow(new AccountNotFoundException(99L));

        mockMvc.perform(post("/api/transactions/deposits").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accountId\": 99, \"amount\": 10}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ACCOUNT_NOT_FOUND"));
    }

    @Test
    void deposit_whenAccountIsNotActive_returns409() throws Exception {
        when(transactionUseCase.deposit(any())).thenThrow(new AccountNotActiveException("5300000001"));

        mockMvc.perform(post("/api/transactions/deposits").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accountId\": 1, \"amount\": 10}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ACCOUNT_NOT_ACTIVE"));
    }

    // ---------- POST /api/transactions/withdrawals ----------

    @Test
    void withdraw_withValidBody_returns201() throws Exception {
        when(transactionUseCase.withdraw(any())).thenReturn(Transaction.restore(11L, 1L, TransactionType.WITHDRAWAL,
                TransactionDirection.DEBIT, new BigDecimal("30.00"), new BigDecimal("70.00"), null, REFERENCE,
                CREATED_AT));

        mockMvc.perform(post("/api/transactions/withdrawals").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accountId\": 1, \"amount\": 30.00}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("WITHDRAWAL"))
                .andExpect(jsonPath("$.direction").value("DEBIT"));

        ArgumentCaptor<WithdrawalCommand> captor = ArgumentCaptor.forClass(WithdrawalCommand.class);
        verify(transactionUseCase).withdraw(captor.capture());
        assertThat(captor.getValue()).isEqualTo(new WithdrawalCommand(1L, new BigDecimal("30.00")));
    }

    @Test
    void withdraw_withInsufficientFunds_returns409() throws Exception {
        when(transactionUseCase.withdraw(any())).thenThrow(new InsufficientFundsException("5300000001"));

        mockMvc.perform(post("/api/transactions/withdrawals").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accountId\": 1, \"amount\": 1000}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_FUNDS"));
    }

    // ---------- POST /api/transactions/transfers ----------

    @Test
    void transfer_withValidBody_returns201WithDebitAndCredit() throws Exception {
        when(transactionUseCase.transfer(any())).thenReturn(List.of(
                Transaction.restore(12L, 1L, TransactionType.TRANSFER, TransactionDirection.DEBIT,
                        new BigDecimal("40.00"), new BigDecimal("60.00"), 2L, REFERENCE, CREATED_AT),
                Transaction.restore(13L, 2L, TransactionType.TRANSFER, TransactionDirection.CREDIT,
                        new BigDecimal("40.00"), new BigDecimal("40.00"), 1L, REFERENCE, CREATED_AT)));

        mockMvc.perform(post("/api/transactions/transfers").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sourceAccountId\": 1, \"targetAccountId\": 2, \"amount\": 40.00}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].direction").value("DEBIT"))
                .andExpect(jsonPath("$[0].counterpartyAccountId").value(2))
                .andExpect(jsonPath("$[1].direction").value("CREDIT"))
                .andExpect(jsonPath("$[1].counterpartyAccountId").value(1));

        ArgumentCaptor<TransferCommand> captor = ArgumentCaptor.forClass(TransferCommand.class);
        verify(transactionUseCase).transfer(captor.capture());
        assertThat(captor.getValue()).isEqualTo(new TransferCommand(1L, 2L, new BigDecimal("40.00")));
    }

    @Test
    void transfer_withEmptyBody_returns400WithEachMissingField() throws Exception {
        mockMvc.perform(post("/api/transactions/transfers").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.sourceAccountId").exists())
                .andExpect(jsonPath("$.errors.targetAccountId").exists())
                .andExpect(jsonPath("$.errors.amount").exists());

        verifyNoInteractions(transactionUseCase);
    }

    @Test
    void transfer_toSameAccount_returns400() throws Exception {
        when(transactionUseCase.transfer(any()))
                .thenThrow(new InvalidTransactionDataException("Cannot transfer to the same account"));

        mockMvc.perform(post("/api/transactions/transfers").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sourceAccountId\": 1, \"targetAccountId\": 1, \"amount\": 10}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_TRANSACTION_DATA"));
    }

    // ---------- GET /api/accounts/{id}/transactions ----------

    @Test
    void findByAccountId_returns200WithStatement() throws Exception {
        when(transactionUseCase.findByAccountId(1L)).thenReturn(List.of(deposit()));

        mockMvc.perform(get("/api/accounts/1/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].type").value("DEPOSIT"));
    }

    @Test
    void findByAccountId_whenAccountDoesNotExist_returns404() throws Exception {
        when(transactionUseCase.findByAccountId(99L)).thenThrow(new AccountNotFoundException(99L));

        mockMvc.perform(get("/api/accounts/99/transactions"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ACCOUNT_NOT_FOUND"));
    }

    // ---------- helpers ----------

    private static Transaction deposit() {
        return Transaction.restore(10L, 1L, TransactionType.DEPOSIT, TransactionDirection.CREDIT,
                new BigDecimal("50.00"), new BigDecimal("150.00"), null, REFERENCE, CREATED_AT);
    }
}
