package com.app.infrastructure.config;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Fuente única de la hora actual. La zona es fija para que las fechas no dependan
 * de la zona del servidor donde se despliegue (en AWS es UTC por defecto).
 */
@Configuration
public class ClockConfig {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Bogota");

    @Bean
    public Clock clock() {
        return Clock.system(BUSINESS_ZONE);
    }
}
