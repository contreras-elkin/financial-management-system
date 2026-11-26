package com.app.domain.model;

/**
 * Estados de una cuenta y las transiciones permitidas entre ellos.
 * Una cuenta activa o inactiva puede pasar a la otra en cualquier momento, o cancelarse;
 * la cancelación es definitiva.
 */
public enum AccountStatus {
    ACTIVE,
    INACTIVE,
    CANCELLED;

    public boolean canTransitionTo(AccountStatus target) {
        return switch (this) {
            case ACTIVE -> target == INACTIVE || target == CANCELLED;
            case INACTIVE -> target == ACTIVE || target == CANCELLED;
            case CANCELLED -> false;
        };
    }
}
