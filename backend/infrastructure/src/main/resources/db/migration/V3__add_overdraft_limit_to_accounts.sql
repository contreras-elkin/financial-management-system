-- Cupo de sobregiro: la cuenta corriente puede quedar en negativo hasta su cupo; la de ahorros no.
ALTER TABLE accounts ADD COLUMN overdraft_limit NUMERIC(19,2) NOT NULL DEFAULT 0;

-- Las corrientes abiertas antes de esta versión reciben el cupo por defecto.
UPDATE accounts SET overdraft_limit = 1000000.00 WHERE account_type = 'CHECKING';

-- El valor lo fija siempre el dominio; el DEFAULT solo servía para las filas existentes.
ALTER TABLE accounts ALTER COLUMN overdraft_limit DROP DEFAULT;

ALTER TABLE accounts
    ADD CONSTRAINT ck_accounts_overdraft_limit_non_negative CHECK (overdraft_limit >= 0),
    ADD CONSTRAINT ck_accounts_savings_no_overdraft CHECK (account_type <> 'SAVINGS' OR overdraft_limit = 0),
    ADD CONSTRAINT ck_accounts_balance_within_overdraft CHECK (balance >= -overdraft_limit);
