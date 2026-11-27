package com.app.domain.model;

import com.app.domain.exception.AccountNotActiveException;
import com.app.domain.exception.InsufficientFundsException;
import com.app.domain.exception.InvalidTransactionDataException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AccountTransactionsTest {

    private static final LocalDateTime CREATED_AT = LocalDateTime.of(2026, 1, 10, 9, 0);
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 3, 15, 14, 30);

    // ---------- consignación ----------

    @Test
    void deposit_increasesBalanceAndRecordsCredit() {
        Account account = savings(1L, AccountStatus.ACTIVE, "100.00");

        Transaction transaction = account.deposit(new BigDecimal("50.00"), NOW);

        assertThat(account.getBalance()).isEqualTo(new BigDecimal("150.00"));
        assertThat(account.getUpdatedAt()).isEqualTo(NOW);
        assertThat(transaction.getId()).isNull();
        assertThat(transaction.getAccountId()).isEqualTo(1L);
        assertThat(transaction.getType()).isEqualTo(TransactionType.DEPOSIT);
        assertThat(transaction.getDirection()).isEqualTo(TransactionDirection.CREDIT);
        assertThat(transaction.getAmount()).isEqualTo(new BigDecimal("50.00"));
        assertThat(transaction.getBalanceAfter()).isEqualTo(new BigDecimal("150.00"));
        assertThat(transaction.getCounterpartyAccountId()).isNull();
        assertThat(transaction.getReference()).isNotNull();
        assertThat(transaction.getCreatedAt()).isEqualTo(NOW);
    }

    @Test
    void deposit_normalizesAmountToTwoDecimals() {
        Account account = savings(1L, AccountStatus.ACTIVE, "0.00");

        Transaction transaction = account.deposit(new BigDecimal("50"), NOW);

        assertThat(transaction.getAmount()).isEqualTo(new BigDecimal("50.00"));
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"0", "0.00", "-10.00", "10.001"})
    void deposit_withInvalidAmount_throwsAndKeepsBalance(String amount) {
        Account account = savings(1L, AccountStatus.ACTIVE, "100.00");

        assertThatThrownBy(() -> account.deposit(amount == null ? null : new BigDecimal(amount), NOW))
                .isInstanceOf(InvalidTransactionDataException.class);
        assertThat(account.getBalance()).isEqualTo(new BigDecimal("100.00"));
    }

    @ParameterizedTest
    @EnumSource(names = {"INACTIVE", "CANCELLED"})
    void deposit_onNonActiveAccount_throws(AccountStatus status) {
        Account account = savings(1L, status, "0.00");

        assertThatThrownBy(() -> account.deposit(new BigDecimal("10.00"), NOW))
                .isInstanceOf(AccountNotActiveException.class);
        assertThat(account.getBalance()).isEqualTo(new BigDecimal("0.00"));
        assertThat(account.getUpdatedAt()).isEqualTo(CREATED_AT);
    }

    // ---------- retiro ----------

    @Test
    void withdraw_decreasesBalanceAndRecordsDebit() {
        Account account = savings(1L, AccountStatus.ACTIVE, "100.00");

        Transaction transaction = account.withdraw(new BigDecimal("30.00"), NOW);

        assertThat(account.getBalance()).isEqualTo(new BigDecimal("70.00"));
        assertThat(transaction.getType()).isEqualTo(TransactionType.WITHDRAWAL);
        assertThat(transaction.getDirection()).isEqualTo(TransactionDirection.DEBIT);
        assertThat(transaction.getBalanceAfter()).isEqualTo(new BigDecimal("70.00"));
    }

    @Test
    void withdraw_wholeSavingsBalance_leavesZero() {
        Account account = savings(1L, AccountStatus.ACTIVE, "100.00");

        account.withdraw(new BigDecimal("100.00"), NOW);

        assertThat(account.getBalance()).isEqualTo(new BigDecimal("0.00"));
    }

    @Test
    void withdraw_moreThanSavingsBalance_throwsAndKeepsBalance() {
        Account account = savings(1L, AccountStatus.ACTIVE, "100.00");

        assertThatThrownBy(() -> account.withdraw(new BigDecimal("100.01"), NOW))
                .isInstanceOf(InsufficientFundsException.class);
        assertThat(account.getBalance()).isEqualTo(new BigDecimal("100.00"));
    }

    @Test
    void withdraw_checkingUpToOverdraftLimit_leavesNegativeBalance() {
        Account account = checking(2L, AccountStatus.ACTIVE, "20000.00");

        account.withdraw(new BigDecimal("1020000.00"), NOW);

        assertThat(account.getBalance()).isEqualTo(new BigDecimal("-1000000.00"));
        assertThat(account.availableBalance()).isEqualTo(new BigDecimal("0.00"));
    }

    @Test
    void withdraw_checkingBeyondOverdraftLimit_throws() {
        Account account = checking(2L, AccountStatus.ACTIVE, "20000.00");

        assertThatThrownBy(() -> account.withdraw(new BigDecimal("1020000.01"), NOW))
                .isInstanceOf(InsufficientFundsException.class);
        assertThat(account.getBalance()).isEqualTo(new BigDecimal("20000.00"));
    }

    @Test
    void withdraw_onInactiveAccount_throws() {
        Account account = savings(1L, AccountStatus.INACTIVE, "100.00");

        assertThatThrownBy(() -> account.withdraw(new BigDecimal("10.00"), NOW))
                .isInstanceOf(AccountNotActiveException.class);
    }

    // ---------- transferencia ----------

    @Test
    void transferTo_movesMoneyAndRecordsLinkedDebitAndCredit() {
        Account source = savings(1L, AccountStatus.ACTIVE, "100.00");
        Account target = checking(2L, AccountStatus.ACTIVE, "0.00");

        List<Transaction> transactions = source.transferTo(target, new BigDecimal("40.00"), NOW);

        assertThat(source.getBalance()).isEqualTo(new BigDecimal("60.00"));
        assertThat(target.getBalance()).isEqualTo(new BigDecimal("40.00"));
        assertThat(target.getUpdatedAt()).isEqualTo(NOW);

        Transaction debit = transactions.get(0);
        Transaction credit = transactions.get(1);
        assertThat(debit.getAccountId()).isEqualTo(1L);
        assertThat(debit.getDirection()).isEqualTo(TransactionDirection.DEBIT);
        assertThat(debit.getCounterpartyAccountId()).isEqualTo(2L);
        assertThat(debit.getBalanceAfter()).isEqualTo(new BigDecimal("60.00"));
        assertThat(credit.getAccountId()).isEqualTo(2L);
        assertThat(credit.getDirection()).isEqualTo(TransactionDirection.CREDIT);
        assertThat(credit.getCounterpartyAccountId()).isEqualTo(1L);
        assertThat(credit.getBalanceAfter()).isEqualTo(new BigDecimal("40.00"));
        assertThat(transactions).allSatisfy(t -> {
            assertThat(t.getType()).isEqualTo(TransactionType.TRANSFER);
            assertThat(t.getAmount()).isEqualTo(new BigDecimal("40.00"));
        });
        assertThat(debit.getReference()).isNotNull().isEqualTo(credit.getReference());
    }

    @Test
    void transferTo_sameAccount_throws() {
        Account source = savings(1L, AccountStatus.ACTIVE, "100.00");
        Account sameAccount = savings(1L, AccountStatus.ACTIVE, "100.00");

        assertThatThrownBy(() -> source.transferTo(sameAccount, new BigDecimal("10.00"), NOW))
                .isInstanceOf(InvalidTransactionDataException.class);
    }

    @Test
    void transferTo_withoutTarget_throws() {
        Account source = savings(1L, AccountStatus.ACTIVE, "100.00");

        assertThatThrownBy(() -> source.transferTo(null, new BigDecimal("10.00"), NOW))
                .isInstanceOf(InvalidTransactionDataException.class);
    }

    @Test
    void transferTo_inactiveTarget_throwsWithoutTouchingSource() {
        Account source = savings(1L, AccountStatus.ACTIVE, "100.00");
        Account target = checking(2L, AccountStatus.INACTIVE, "0.00");

        assertThatThrownBy(() -> source.transferTo(target, new BigDecimal("10.00"), NOW))
                .isInstanceOf(AccountNotActiveException.class);
        assertThat(source.getBalance()).isEqualTo(new BigDecimal("100.00"));
        assertThat(source.getUpdatedAt()).isEqualTo(CREATED_AT);
    }

    @Test
    void transferTo_inactiveSource_throws() {
        Account source = savings(1L, AccountStatus.INACTIVE, "100.00");
        Account target = checking(2L, AccountStatus.ACTIVE, "0.00");

        assertThatThrownBy(() -> source.transferTo(target, new BigDecimal("10.00"), NOW))
                .isInstanceOf(AccountNotActiveException.class);
        assertThat(target.getBalance()).isEqualTo(new BigDecimal("0.00"));
    }

    @Test
    void transferTo_insufficientFunds_throwsWithoutTouchingEitherAccount() {
        Account source = savings(1L, AccountStatus.ACTIVE, "100.00");
        Account target = checking(2L, AccountStatus.ACTIVE, "0.00");

        assertThatThrownBy(() -> source.transferTo(target, new BigDecimal("100.01"), NOW))
                .isInstanceOf(InsufficientFundsException.class);
        assertThat(source.getBalance()).isEqualTo(new BigDecimal("100.00"));
        assertThat(target.getBalance()).isEqualTo(new BigDecimal("0.00"));
    }

    // ---------- helpers ----------

    private static Account savings(Long id, AccountStatus status, String balance) {
        return Account.restore(id, AccountType.SAVINGS, "530000000" + id, status, new BigDecimal(balance),
                AccountType.SAVINGS.getDefaultOverdraftLimit(), false, 7L, CREATED_AT, CREATED_AT);
    }

    private static Account checking(Long id, AccountStatus status, String balance) {
        return Account.restore(id, AccountType.CHECKING, "330000000" + id, status, new BigDecimal(balance),
                AccountType.CHECKING.getDefaultOverdraftLimit(), false, 7L, CREATED_AT, CREATED_AT);
    }
}
