package com.app.infrastructure.web.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.app.application.port.in.AccountUseCase;
import com.app.application.port.in.CreateAccountCommand;
import com.app.domain.exception.AccountBalanceNotZeroException;
import com.app.domain.exception.AccountNotFoundException;
import com.app.domain.exception.ClientNotFoundException;
import com.app.domain.exception.GmfExemptionAlreadyAssignedException;
import com.app.domain.exception.InvalidAccountStatusTransitionException;
import com.app.domain.model.Account;
import com.app.domain.model.AccountStatus;
import com.app.domain.model.AccountType;

@WebMvcTest(AccountController.class)
class AccountControllerTest {

    private static final String BASE_URL = "/api/accounts";
    private static final LocalDateTime CREATED_AT = LocalDateTime.of(2026, 11, 26, 10, 0);

    private static final String VALID_CREATE_BODY = """
            {
              "clientId": 7,
              "type": "SAVINGS",
              "gmfExempt": true
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AccountUseCase accountUseCase;

    // ---------- POST /api/accounts ----------

    @Test
    void create_withValidBody_returns201WithLocationAndAccount() throws Exception {
        when(accountUseCase.create(any())).thenReturn(account(1L, AccountStatus.ACTIVE));

        mockMvc.perform(post(BASE_URL).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE_BODY))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/accounts/1"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.number").value("5300000001"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.balance").value(0))
                .andExpect(jsonPath("$.clientId").value(7));

        ArgumentCaptor<CreateAccountCommand> captor = ArgumentCaptor.forClass(CreateAccountCommand.class);
        verify(accountUseCase).create(captor.capture());
        assertThat(captor.getValue()).isEqualTo(new CreateAccountCommand(7L, AccountType.SAVINGS, true));
    }

    @Test
    void create_withEmptyBody_returns400WithEachMissingFieldAndDoesNotCallUseCase() throws Exception {
        mockMvc.perform(post(BASE_URL).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors.clientId").exists())
                .andExpect(jsonPath("$.errors.type").exists())
                .andExpect(jsonPath("$.errors.gmfExempt").exists());

        verifyNoInteractions(accountUseCase);
    }

    @Test
    void create_withUnknownType_returns400AndDoesNotCallUseCase() throws Exception {
        String body = VALID_CREATE_BODY.replace("SAVINGS", "CDT");

        mockMvc.perform(post(BASE_URL).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(accountUseCase);
    }

    @Test
    void create_forMissingClient_returns404() throws Exception {
        when(accountUseCase.create(any())).thenThrow(new ClientNotFoundException(7L));

        mockMvc.perform(post(BASE_URL).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE_BODY))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("CLIENT_NOT_FOUND"));
    }

    @Test
    void create_whenClientAlreadyHasGmfExemptAccount_returns409() throws Exception {
        when(accountUseCase.create(any())).thenThrow(new GmfExemptionAlreadyAssignedException(7L));

        mockMvc.perform(post(BASE_URL).contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("GMF_EXEMPTION_ALREADY_ASSIGNED"));
    }

    // ---------- GET ----------

    @Test
    void findById_whenAccountExists_returns200() throws Exception {
        when(accountUseCase.findById(1L)).thenReturn(account(1L, AccountStatus.ACTIVE));

        mockMvc.perform(get(BASE_URL + "/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("SAVINGS"))
                .andExpect(jsonPath("$.gmfExempt").value(true));
    }

    @Test
    void findById_whenAccountDoesNotExist_returns404() throws Exception {
        when(accountUseCase.findById(99L)).thenThrow(new AccountNotFoundException(99L));

        mockMvc.perform(get(BASE_URL + "/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ACCOUNT_NOT_FOUND"));
    }

    @Test
    void findAll_withoutFilter_returnsAllAccounts() throws Exception {
        when(accountUseCase.findAll())
                .thenReturn(List.of(account(1L, AccountStatus.ACTIVE), account(2L, AccountStatus.INACTIVE)));

        mockMvc.perform(get(BASE_URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].status").value("INACTIVE"));

        verify(accountUseCase, never()).findByClientId(any());
    }

    @Test
    void findAll_withClientId_returnsClientAccounts() throws Exception {
        when(accountUseCase.findByClientId(7L)).thenReturn(List.of(account(1L, AccountStatus.ACTIVE)));

        mockMvc.perform(get(BASE_URL).param("clientId", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        verify(accountUseCase, never()).findAll();
    }

    // ---------- PATCH status changes ----------

    @Test
    void activate_returns200WithAccount() throws Exception {
        when(accountUseCase.activate(1L)).thenReturn(account(1L, AccountStatus.ACTIVE));

        mockMvc.perform(patch(BASE_URL + "/1/activate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void inactivate_returns200WithAccount() throws Exception {
        when(accountUseCase.inactivate(1L)).thenReturn(account(1L, AccountStatus.INACTIVE));

        mockMvc.perform(patch(BASE_URL + "/1/inactivate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }

    @Test
    void cancel_returns200WithAccount() throws Exception {
        when(accountUseCase.cancel(1L)).thenReturn(account(1L, AccountStatus.CANCELLED));

        mockMvc.perform(patch(BASE_URL + "/1/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void cancel_withBalance_returns409() throws Exception {
        when(accountUseCase.cancel(1L)).thenThrow(new AccountBalanceNotZeroException("5300000001"));

        mockMvc.perform(patch(BASE_URL + "/1/cancel"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ACCOUNT_BALANCE_NOT_ZERO"));
    }

    @Test
    void activate_cancelledAccount_returns409() throws Exception {
        when(accountUseCase.activate(1L))
                .thenThrow(new InvalidAccountStatusTransitionException(AccountStatus.CANCELLED, AccountStatus.ACTIVE));

        mockMvc.perform(patch(BASE_URL + "/1/activate"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("INVALID_ACCOUNT_STATUS_TRANSITION"));
    }

    // ---------- helpers ----------

    private static Account account(Long id, AccountStatus status) {
        return Account.restore(id, AccountType.SAVINGS, "5300000001", status, BigDecimal.ZERO, true, 7L,
                CREATED_AT, CREATED_AT);
    }
}
