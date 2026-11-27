package com.app.application.port.in;

import java.math.BigDecimal;

public record TransferCommand(
        Long sourceAccountId,
        Long targetAccountId,
        BigDecimal amount
) {
}
