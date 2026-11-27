package com.app.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.app.application.port.in.DepositCommand;
import com.app.application.port.in.TransferCommand;
import com.app.application.port.in.WithdrawalCommand;
import com.app.application.port.out.AccountRepository;
import com.app.application.port.out.TransactionRepository;
import com.app.domain.exception.AccountNotActiveException;
import com.app.domain.exception.AccountNotFoundException;
import com.app.domain.exception.InsufficientFundsException;
import com.app.domain.exception.InvalidTransactionDataException;
import com.app.domain.model.Account;
import com.app.domain.model.AccountStatus;
import com.app.domain.model.AccountType;
import com.app.domain.model.Transaction;
import com.app.domain.model.TransactionDirection;
import com.app.domain.model.TransactionType;

// Las reglas de saldo y estado las prueba AccountTransactionsTest; aquí se prueba la orquestación.
@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    private static final ZoneId ZONE = ZoneId.of("America/Bogota");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 27, 10, 0);
    private static final LocalDateTime CREATED_AT = LocalDateTime.of(2026, 2, 1, 9, 0);

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AccountRepository accountRepository;

    @Captor
    private ArgumentCaptor<Account> accountCaptor;

    private TransactionService transactionService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(NOW.atZone(ZONE).toInstant(), ZONE);
        transactionService = new TransactionService(transactionRepository, accountRepository, fixedClock);
    }

    // ---------- deposit ----------

    @Test
    void deposit_locksAccountAndSavesBalanceAndTransaction() {
        when(accountRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(savings(1L, "100.00")));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Transaction transaction = transactionService.deposit(new DepositCommand(1L, new BigDecimal("50.00")));

        verify(accountRepository).save(accountCaptor.capture());
        assertThat(accountCaptor.getValue().getBalance()).isEqualTo(new BigDecimal("150.00"));
        assertThat(accountCaptor.getValue().getUpdatedAt()).isEqualTo(NOW);
        assertThat(transaction.getType()).isEqualTo(TransactionType.DEPOSIT);
        assertThat(transaction.getBalanceAfter()).isEqualTo(new BigDecimal("150.00"));
        assertThat(transaction.getCreatedAt()).isEqualTo(NOW);
    }

    @Test
    void deposit_whenAccountDoesNotExist_throwsAndSavesNothing() {
        when(accountRepository.findByIdForUpdate(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.deposit(new DepositCommand(99L, new BigDecimal("50.00"))))
                .isInstanceOf(AccountNotFoundException.class);
        verify(accountRepository, never()).save(any());
        verifyNoInteractions(transactionRepository);
    }

    @Test
    void deposit_withoutAccountId_throwsWithoutQueryingRepositories() {
        assertThatThrownBy(() -> transactionService.deposit(new DepositCommand(null, new BigDecimal("50.00"))))
                .isInstanceOf(InvalidTransactionDataException.class);
        verifyNoInteractions(accountRepository, transactionRepository);
    }

    @Test
    void deposit_whenDomainRejects_savesNothing() {
        when(accountRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(account(1L, AccountType.SAVINGS, AccountStatus.INACTIVE, "100.00")));

        assertThatThrownBy(() -> transactionService.deposit(new DepositCommand(1L, new BigDecimal("50.00"))))
                .isInstanceOf(AccountNotActiveException.class);
        verify(accountRepository, never()).save(any());
        verifyNoInteractions(transactionRepository);
    }

    // ---------- withdraw ----------

    @Test
    void withdraw_locksAccountAndSavesBalanceAndTransaction() {
        when(accountRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(savings(1L, "100.00")));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Transaction transaction = transactionService.withdraw(new WithdrawalCommand(1L, new BigDecimal("30.00")));

        verify(accountRepository).save(accountCaptor.capture());
        assertThat(accountCaptor.getValue().getBalance()).isEqualTo(new BigDecimal("70.00"));
        assertThat(transaction.getType()).isEqualTo(TransactionType.WITHDRAWAL);
        assertThat(transaction.getDirection()).isEqualTo(TransactionDirection.DEBIT);
    }

    @Test
    void withdraw_withInsufficientFunds_savesNothing() {
        when(accountRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(savings(1L, "100.00")));

        assertThatThrownBy(() -> transactionService.withdraw(new WithdrawalCommand(1L, new BigDecimal("100.01"))))
                .isInstanceOf(InsufficientFundsException.class);
        verify(accountRepository, never()).save(any());
        verifyNoInteractions(transactionRepository);
    }

    @Test
    void withdraw_withoutAccountId_throws() {
        assertThatThrownBy(() -> transactionService.withdraw(new WithdrawalCommand(null, new BigDecimal("1.00"))))
                .isInstanceOf(InvalidTransactionDataException.class);
        verifyNoInteractions(accountRepository, transactionRepository);
    }

    // ---------- transfer ----------

    @Test
    void transfer_savesBothAccountsAndBothTransactions() {
        when(accountRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(savings(1L, "100.00")));
        when(accountRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(checking(2L, "0.00")));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<Transaction> transactions = transactionService.transfer(
                new TransferCommand(1L, 2L, new BigDecimal("40.00")));

        verify(accountRepository, times(2)).save(accountCaptor.capture());
        assertThat(accountCaptor.getAllValues())
                .extracting(Account::getId, Account::getBalance)
                .containsExactly(
                        tuple(1L, new BigDecimal("60.00")),
                        tuple(2L, new BigDecimal("40.00")));
        assertThat(transactions)
                .extracting(Transaction::getAccountId, Transaction::getDirection)
                .containsExactly(
                        tuple(1L, TransactionDirection.DEBIT),
                        tuple(2L, TransactionDirection.CREDIT));
    }

    @Test
    void transfer_locksAccountsInAscendingIdOrderRegardlessOfDirection() {
        when(accountRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(checking(1L, "0.00")));
        when(accountRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(savings(2L, "100.00")));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<Transaction> transactions = transactionService.transfer(
                new TransferCommand(2L, 1L, new BigDecimal("40.00")));

        InOrder lockOrder = inOrder(accountRepository);
        lockOrder.verify(accountRepository).findByIdForUpdate(1L);
        lockOrder.verify(accountRepository).findByIdForUpdate(2L);
        assertThat(transactions.get(0).getAccountId()).isEqualTo(2L);
        assertThat(transactions.get(0).getDirection()).isEqualTo(TransactionDirection.DEBIT);
    }

    @Test
    void transfer_toSameAccount_throwsWithoutQueryingRepositories() {
        assertThatThrownBy(() -> transactionService.transfer(new TransferCommand(1L, 1L, new BigDecimal("10.00"))))
                .isInstanceOf(InvalidTransactionDataException.class);
        verifyNoInteractions(accountRepository, transactionRepository);
    }

    @Test
    void transfer_withoutTargetAccount_throws() {
        assertThatThrownBy(() -> transactionService.transfer(new TransferCommand(1L, null, new BigDecimal("10.00"))))
                .isInstanceOf(InvalidTransactionDataException.class);
        verifyNoInteractions(accountRepository, transactionRepository);
    }

    @Test
    void transfer_whenTargetDoesNotExist_throwsAndSavesNothing() {
        when(accountRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(savings(1L, "100.00")));
        when(accountRepository.findByIdForUpdate(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.transfer(new TransferCommand(1L, 99L, new BigDecimal("10.00"))))
                .isInstanceOf(AccountNotFoundException.class);
        verify(accountRepository, never()).save(any());
        verifyNoInteractions(transactionRepository);
    }

    @Test
    void transfer_withInsufficientFunds_savesNothing() {
        when(accountRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(savings(1L, "100.00")));
        when(accountRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(checking(2L, "0.00")));

        assertThatThrownBy(() -> transactionService.transfer(new TransferCommand(1L, 2L, new BigDecimal("100.01"))))
                .isInstanceOf(InsufficientFundsException.class);
        verify(accountRepository, never()).save(any());
        verifyNoInteractions(transactionRepository);
    }

    // ---------- findByAccountId ----------

    @Test
    void findByAccountId_returnsAccountStatement() {
        Transaction deposit = Transaction.restore(10L, 1L, TransactionType.DEPOSIT, TransactionDirection.CREDIT,
                new BigDecimal("50.00"), new BigDecimal("50.00"), null, UUID.randomUUID(), CREATED_AT);
        when(accountRepository.findById(1L)).thenReturn(Optional.of(savings(1L, "50.00")));
        when(transactionRepository.findByAccountId(1L)).thenReturn(List.of(deposit));

        assertThat(transactionService.findByAccountId(1L)).containsExactly(deposit);
    }

    @Test
    void findByAccountId_whenAccountDoesNotExist_throws() {
        when(accountRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.findByAccountId(99L))
                .isInstanceOf(AccountNotFoundException.class);
        verifyNoInteractions(transactionRepository);
    }

    // ---------- helpers ----------

    private static Account savings(Long id, String balance) {
        return account(id, AccountType.SAVINGS, AccountStatus.ACTIVE, balance);
    }

    private static Account checking(Long id, String balance) {
        return account(id, AccountType.CHECKING, AccountStatus.ACTIVE, balance);
    }

    private static Account account(Long id, AccountType type, AccountStatus status, String balance) {
        return Account.restore(id, type, type.getNumberPrefix() + "0000000" + id, status, new BigDecimal(balance),
                type.getDefaultOverdraftLimit(), false, 7L, CREATED_AT, CREATED_AT);
    }
}
