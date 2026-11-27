package com.app.infrastructure.persistence.adapter;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import com.app.application.port.out.AccountNumberGenerator;
import com.app.domain.model.AccountType;

/**
 * nextval es atómico: dos peticiones simultáneas nunca reciben el mismo valor.
 */
@Component
public class SequenceAccountNumberGenerator implements AccountNumberGenerator {

    private final JdbcClient jdbcClient;

    public SequenceAccountNumberGenerator(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    @Override
    public String nextNumber(AccountType type) {
        String sequence = switch (type) {
            case SAVINGS -> "savings_account_number_seq";
            case CHECKING -> "checking_account_number_seq";
        };
        long value = jdbcClient.sql("SELECT nextval('" + sequence + "')")
                .query(Long.class)
                .single();
        return type.getNumberPrefix() + String.format("%08d", value);
    }
}
