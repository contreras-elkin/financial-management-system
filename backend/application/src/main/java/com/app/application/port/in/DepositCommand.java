package com.app.application.port.in;

import java.math.BigDecimal;

public record DepositCommand(
        Long accountId,
        BigDecimal amount
) {
}
