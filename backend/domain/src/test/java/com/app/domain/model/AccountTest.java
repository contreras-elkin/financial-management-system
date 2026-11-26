package com.app.domain.model;

import com.app.domain.exception.AccountBalanceNotZeroException;
import com.app.domain.exception.InvalidAccountDataException;
import com.app.domain.exception.InvalidAccountStatusTransitionException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AccountTest {

    private static final LocalDateTime CREATED_AT = LocalDateTime.of(2026, 1, 10, 9, 0);
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 3, 15, 14, 30);
    private static final String SAVINGS_NUMBER = "5300000001";
    private static final String CHECKING_NUMBER = "3300000001";
    private static final Long CLIENT_ID = 7L;

    @Test
    void create_opensActiveAccountWithZeroBalance() {
        Account account = Account.create(AccountType.SAVINGS, SAVINGS_NUMBER, CLIENT_ID, true, NOW);

        assertThat(account.getId()).isNull();
        assertThat(account.getType()).isEqualTo(AccountType.SAVINGS);
        assertThat(account.getNumber()).isEqualTo(SAVINGS_NUMBER);
        assertThat(account.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(account.getBalance()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(account.isGmfExempt()).isTrue();
        assertThat(account.getClientId()).isEqualTo(CLIENT_ID);
        assertThat(account.getCreatedAt()).isEqualTo(NOW);
        assertThat(account.getUpdatedAt()).isEqualTo(NOW);
    }

    @Test
    void create_checkingAccountIsAlsoActive() {
        Account account = Account.create(AccountType.CHECKING, CHECKING_NUMBER, CLIENT_ID, false, NOW);

        assertThat(account.getStatus()).isEqualTo(AccountStatus.ACTIVE);
    }

    @Test
    void create_withoutType_throws() {
        assertThatThrownBy(() -> Account.create(null, SAVINGS_NUMBER, CLIENT_ID, false, NOW))
                .isInstanceOf(InvalidAccountDataException.class);
    }

    @Test
    void create_withoutClient_throws() {
        assertThatThrownBy(() -> Account.create(AccountType.SAVINGS, SAVINGS_NUMBER, null, false, NOW))
                .isInstanceOf(InvalidAccountDataException.class);
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"530000001", "53000000011", "53000A0001", "3300000001"})
    void create_withInvalidNumberForSavings_throws(String number) {
        assertThatThrownBy(() -> Account.create(AccountType.SAVINGS, number, CLIENT_ID, false, NOW))
                .isInstanceOf(InvalidAccountDataException.class);
    }

    @Test
    void create_checkingWithSavingsPrefix_throws() {
        assertThatThrownBy(() -> Account.create(AccountType.CHECKING, SAVINGS_NUMBER, CLIENT_ID, false, NOW))
                .isInstanceOf(InvalidAccountDataException.class);
    }

    @Test
    void inactivate_activeAccount_changesStatusAndUpdatedAt() {
        Account account = restore(AccountStatus.ACTIVE, BigDecimal.ZERO);

        account.inactivate(NOW);

        assertThat(account.getStatus()).isEqualTo(AccountStatus.INACTIVE);
        assertThat(account.getUpdatedAt()).isEqualTo(NOW);
    }

    @Test
    void activate_inactiveAccount_changesStatusAndUpdatedAt() {
        Account account = restore(AccountStatus.INACTIVE, new BigDecimal("50000.00"));

        account.activate(NOW);

        assertThat(account.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(account.getUpdatedAt()).isEqualTo(NOW);
    }

    @Test
    void activate_alreadyActiveAccount_isIdempotent() {
        Account account = restore(AccountStatus.ACTIVE, BigDecimal.ZERO);

        account.activate(NOW);

        assertThat(account.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(account.getUpdatedAt()).isEqualTo(CREATED_AT);
    }

    @ParameterizedTest
    @EnumSource(names = {"ACTIVE", "INACTIVE"})
    void cancel_withZeroBalance_cancelsAccount(AccountStatus initialStatus) {
        Account account = restore(initialStatus, new BigDecimal("0.00"));

        account.cancel(NOW);

        assertThat(account.getStatus()).isEqualTo(AccountStatus.CANCELLED);
        assertThat(account.getUpdatedAt()).isEqualTo(NOW);
    }

    @Test
    void cancel_withBalance_throws() {
        Account account = restore(AccountStatus.ACTIVE, new BigDecimal("0.01"));

        assertThatThrownBy(() -> account.cancel(NOW))
                .isInstanceOf(AccountBalanceNotZeroException.class);
        assertThat(account.getStatus()).isEqualTo(AccountStatus.ACTIVE);
    }

    @Test
    void cancel_alreadyCancelledAccount_isIdempotent() {
        Account account = restore(AccountStatus.CANCELLED, BigDecimal.ZERO);

        account.cancel(NOW);

        assertThat(account.getStatus()).isEqualTo(AccountStatus.CANCELLED);
        assertThat(account.getUpdatedAt()).isEqualTo(CREATED_AT);
    }

    @Test
    void activate_cancelledAccount_throws() {
        Account account = restore(AccountStatus.CANCELLED, BigDecimal.ZERO);

        assertThatThrownBy(() -> account.activate(NOW))
                .isInstanceOf(InvalidAccountStatusTransitionException.class);
        assertThat(account.getStatus()).isEqualTo(AccountStatus.CANCELLED);
        assertThat(account.getUpdatedAt()).isEqualTo(CREATED_AT);
    }

    @Test
    void inactivate_cancelledAccount_throws() {
        Account account = restore(AccountStatus.CANCELLED, BigDecimal.ZERO);

        assertThatThrownBy(() -> account.inactivate(NOW))
                .isInstanceOf(InvalidAccountStatusTransitionException.class);
        assertThat(account.getStatus()).isEqualTo(AccountStatus.CANCELLED);
    }

    private static Account restore(AccountStatus status, BigDecimal balance) {
        return Account.restore(1L, AccountType.SAVINGS, SAVINGS_NUMBER, status, balance, false, CLIENT_ID,
                CREATED_AT, CREATED_AT);
    }
}
