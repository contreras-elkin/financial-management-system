package com.app.application.port.in;

import java.math.BigDecimal;

public record WithdrawalCommand(
        Long accountId,
        BigDecimal amount
) {
}
