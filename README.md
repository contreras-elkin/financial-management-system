# Financial Management System

Aplicación interna para que los trabajadores de una entidad financiera administren clientes, sus productos (cuentas de ahorros y corrientes) y los movimientos sobre esas cuentas: consignaciones, retiros y transferencias, con su estado de cuenta.

- **Backend:** Java 21, Spring Boot 4, arquitectura hexagonal en módulos Maven, Spring Data JPA y Flyway.
- **Base de datos:** PostgreSQL 17.
- **Frontend:** React 19, TypeScript, Vite, MUI, TanStack Query, React Hook Form y Zod.
- **Infraestructura:** Docker Compose, GitHub Actions, GitHub Container Registry y AWS (CloudFront + EC2).

**Demo:** https://dj7xf44ldmk05.cloudfront.net (disponible durante el periodo de evaluación).

**Contenido:** [Funcionalidades](#funcionalidades-y-reglas-de-negocio) · [Cómo ejecutarlo](#cómo-ejecutarlo) · [Arquitectura](#arquitectura) · [API REST](#api-rest) · [Patrones de diseño](#patrones-de-diseño) · [SOLID](#principios-solid) · [ACID](#acid) · [Base de datos](#base-de-datos) · [Tests y CI](#tests-y-ci) · [Git flow](#git-flow) · [Despliegue en AWS](#despliegue-en-aws) · [Mejoras](#mejoras-posibles)

## Funcionalidades y reglas de negocio

Cada regla se valida en el dominio o en el servicio y, además, en la base de datos como defensa en profundidad: aunque alguien escriba directo en la BD, los datos no quedan inconsistentes.

### Clientes

Registro, consulta, actualización y eliminación.

| Regla | Aplicación | Base de datos |
|---|---|---|
| No puede existir un cliente menor de edad | `Client.create` / `update` (`CLIENT_UNDERAGE`) | `ck_clients_legal_age` |
| Correo con formato `xxxx@xxxxx.xxx` | `Client` | `ck_clients_email_format` |
| Nombre y apellido de al menos 2 caracteres | `Client` | `ck_clients_first_name_length`, `ck_clients_last_name_length` |
| Fechas de creación y modificación automáticas | `Client` con un `Clock` inyectado | `ck_clients_updated_after_created` |
| Tipo y número de identificación únicos | `ClientService` (`CLIENT_ALREADY_EXISTS`) | `uq_clients_identification` |
| No se elimina un cliente con productos | `ClientService` (`CLIENT_HAS_PRODUCTS`) | `fk_accounts_client` (`ON DELETE RESTRICT`) |

### Cuentas

Apertura, consulta (todas o por cliente), activación, inactivación y cancelación. Las cuentas no se borran: se cancelan y conservan su historial.

| Regla | Aplicación | Base de datos |
|---|---|---|
| Solo cuentas de ahorros o corrientes | `AccountType` | `ck_accounts_type` |
| Toda cuenta pertenece a un cliente existente | `AccountService` (`CLIENT_NOT_FOUND`) | `fk_accounts_client` |
| Número único de 10 dígitos: `53` ahorros, `33` corriente | `SequenceAccountNumberGenerator` (una secuencia por tipo) | `uq_accounts_number`, `ck_accounts_number_format` |
| Se abre activa y con saldo $ 0 | `Account.create` | — |
| Se activa o inactiva en cualquier momento; una cancelada ya no cambia | `AccountStatus.canTransitionTo` | `ck_accounts_status` (solo estados válidos) |
| Solo se cancela con saldo $ 0 | `Account.cancel` (`ACCOUNT_BALANCE_NOT_ZERO`) | `ck_accounts_cancelled_balance` |
| La cuenta de ahorros no puede quedar en negativo | `Account` (cupo de sobregiro 0) | `ck_accounts_savings_balance`, `ck_accounts_savings_no_overdraft` |
| Una sola cuenta exenta de GMF por cliente | `AccountService` (`GMF_EXEMPTION_ALREADY_ASSIGNED`) | `uq_accounts_client_gmf_exempt` |

La cuenta corriente tiene un cupo de sobregiro de $ 1.000.000. El **saldo disponible** es el saldo más el cupo: se calcula, no se guarda.

### Transacciones

| Regla | Aplicación | Base de datos |
|---|---|---|
| Solo consignación, retiro y transferencia | `TransactionType` | `ck_transactions_type` |
| El saldo y el disponible se actualizan con cada movimiento | `Account.deposit` / `withdraw` / `transferTo` | `ck_accounts_balance_within_overdraft` |
| No se retira ni se transfiere más que el disponible | `Account` (`INSUFFICIENT_FUNDS`) | `ck_accounts_balance_within_overdraft` |
| Solo se mueve dinero en cuentas activas | `Account` (`ACCOUNT_NOT_ACTIVE`) | — |
| La transferencia es entre cuentas existentes y distintas | `TransactionService` | `fk_transactions_counterparty`, `ck_transactions_counterparty_not_self` |
| La transferencia genera un débito en el origen y un crédito en el destino | `Account.transferTo` (dos movimientos con la misma referencia) | `uq_transactions_reference_direction` |

Los movimientos no se editan ni se borran. Cada uno guarda el saldo resultante (`balance_after`), que es lo que muestra el estado de cuenta.

## Cómo ejecutarlo

### Con Docker (recomendado)

Requiere Docker con Compose 2.24 o superior.

```bash
cp .env.example .env      # credenciales de la BD y puertos
docker compose up --build
```

| Servicio | URL |
|---|---|
| Aplicación web | http://localhost:3000 |
| API | http://localhost:8080/api |
| Estado de la API | http://localhost:8080/actuator/health |

Flyway crea el esquema al arrancar la API. Para borrar también los datos: `docker compose down -v`.

### En desarrollo

Requiere JDK 21, Node 22 y un PostgreSQL. La API toma la conexión de `DB_URL`, `DB_USERNAME` y `DB_PASSWORD` (por defecto `localhost:5432/financial_db`).

```bash
# Terminal 1: API en http://localhost:8080
cd backend
./mvnw package -DskipTests
java -jar infrastructure/target/infrastructure-*.jar

# Terminal 2: front en http://localhost:5173 (Vite reenvía /api a localhost:8080)
cd frontend
npm ci
npm run dev
```

### Tests

```bash
# Backend: unitarios, integración con Testcontainers (requiere Docker) y umbral de cobertura
cd backend
./mvnw clean verify

# Frontend
cd frontend
npm test
npm run lint
npm run build
```

## Arquitectura

### Componentes

```mermaid
flowchart LR
    browser[Navegador] --> web
    subgraph compose[Docker Compose]
        web["web<br/>nginx + React"] -->|/api| api["api<br/>Spring Boot"]
        api --> db[("db<br/>PostgreSQL")]
    end
```

- **web:** nginx sirve el build de React y reenvía `/api` a la API (reverse proxy). Front y API comparten origen, así que no hace falta CORS y la API no queda expuesta.
- **api:** Spring Boot con Flyway. Solo se publica el puerto para desarrollo; en producción solo la alcanza nginx.
- **db:** PostgreSQL con volumen persistente y sin puertos publicados.

### Backend: arquitectura hexagonal

El backend es un proyecto Maven con tres módulos. Las dependencias van siempre hacia el dominio y las impone el compilador: `domain` y `application` no declaran Spring en sus `pom.xml`, así que no pueden usarlo aunque alguien lo intente.

```mermaid
flowchart LR
    subgraph infrastructure
        web["web<br/>controllers y DTO"]
        persistence["persistence<br/>adaptadores JPA"]
        config["config<br/>composition root"]
    end
    subgraph application
        in["port.in<br/>casos de uso"]
        service["service"]
        out["port.out<br/>repositorios"]
    end
    subgraph domain
        model["model<br/>entidades y reglas"]
    end
    web --> in
    service -. implementa .-> in
    service --> out
    persistence -. implementa .-> out
    service --> model
    config -. arma .-> service
```

| Módulo | Contiene | Depende de |
|---|---|---|
| `domain` | Entidades con sus reglas (`Client`, `Account`, `Transaction`), enums y excepciones de negocio | Nada (Java puro) |
| `application` | Puertos de entrada (`ClientUseCase`...), puertos de salida (`ClientRepository`...) y servicios que orquestan los casos de uso | `domain` |
| `infrastructure` | Controllers REST, adaptadores de persistencia, entidades JPA, migraciones, configuración y la clase `main` | `application`, Spring |

Las capas que pide la prueba están en estos paquetes:

| Capa | Dónde |
|---|---|
| **Entity** | `domain/model` (dominio) y `infrastructure/persistence/entity` (mapeo JPA, separado del dominio) |
| **Service** | `application/service` |
| **Controller** | `infrastructure/web/controller` |
| **Repository** | `application/port/out` (puerto) e `infrastructure/persistence` (adaptador y Spring Data) |

Recorrido de una petición, por ejemplo una consignación:

```
TransactionController (DTO → comando)
  → TransactionalTransactionUseCase (abre la transacción)
    → TransactionService (bloquea la cuenta y orquesta)
      → Account.deposit (regla de negocio: cambia el saldo y crea el movimiento)
    → AccountRepository / TransactionRepository (puertos)
      → adaptadores JPA → PostgreSQL
```

### Frontend

```
frontend/src/
├── app/          # composition root: providers, tema, rutas
├── shared/       # lo transversal: cliente HTTP, Layout, componentes y formato
└── features/     # un dominio por carpeta
    ├── clients/
    ├── accounts/
    └── transactions/
```

Cada feature tiene la misma estructura: `types.ts` (espejo del contrato de la API), `api.ts` (endpoints), `hooks.ts` (estado del servidor con TanStack Query), `schema.ts` (validación con Zod), `errorMessages.ts` y los componentes con sus tests. Cada página se carga bajo demanda, en un archivo aparte que solo se descarga al visitarla.

## API REST

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/clients` | Registra un cliente |
| `GET` | `/api/clients` | Lista los clientes |
| `GET` | `/api/clients/{id}` | Consulta un cliente |
| `PUT` | `/api/clients/{id}` | Actualiza los datos personales |
| `DELETE` | `/api/clients/{id}` | Elimina un cliente sin productos |
| `POST` | `/api/accounts` | Abre una cuenta |
| `GET` | `/api/accounts?clientId=` | Lista las cuentas, opcionalmente de un cliente |
| `GET` | `/api/accounts/{id}` | Consulta una cuenta |
| `PATCH` | `/api/accounts/{id}/activate` · `inactivate` · `cancel` | Cambia el estado |
| `POST` | `/api/transactions/deposits` | Consignación |
| `POST` | `/api/transactions/withdrawals` | Retiro |
| `POST` | `/api/transactions/transfers` | Transferencia (responde el débito y el crédito) |
| `GET` | `/api/accounts/{id}/transactions` | Estado de cuenta, del más reciente al más antiguo |

Los errores siguen el estándar `ProblemDetail` (RFC 9457) con una extensión `code` estable, independiente del idioma. El front traduce ese código al mensaje que ve el usuario.

```json
{
  "status": 409,
  "title": "Conflict with current state",
  "detail": "Account 5300000001 does not have enough available balance",
  "code": "INSUFFICIENT_FUNDS"
}
```

| Status | Cuándo |
|---|---|
| `400` | Datos inválidos (`VALIDATION_FAILED`, con el detalle por campo en `errors`) o una regla de negocio |
| `404` | El recurso no existe (`CLIENT_NOT_FOUND`, `ACCOUNT_NOT_FOUND`) |
| `409` | Conflicto con el estado actual (`CLIENT_HAS_PRODUCTS`, `INSUFFICIENT_FUNDS`, `ACCOUNT_NOT_ACTIVE`...) |

## Patrones de diseño

### Backend

| Patrón | Dónde | Para qué |
|---|---|---|
| Puertos y adaptadores | `application/port`, `infrastructure/persistence/adapter` | El negocio no conoce JPA ni HTTP; cambiar de base de datos solo toca adaptadores |
| Repository | `ClientRepository`, `AccountRepository`, `TransactionRepository` | Acceso a datos como si fuera una colección del dominio |
| Adapter | `*PersistenceAdapter`, `SequenceAccountNumberGenerator` | Traducen los puertos a Spring Data y a secuencias de PostgreSQL |
| Decorator | `TransactionalClientUseCase`, `TransactionalAccountUseCase`, `TransactionalTransactionUseCase` | Agregan `@Transactional` alrededor del caso de uso sin meter Spring en el servicio |
| Composition root | `ClientConfig`, `AccountConfig`, `TransactionConfig` | Un solo lugar donde se arma cada caso de uso con sus dependencias |
| Static factory method | `Client.create` / `restore`, `Account.create` / `restore` | `create` valida las reglas de un objeto nuevo; `restore` reconstruye uno guardado sin volver a validar |
| Modelo de dominio rico | `Account.deposit`, `withdraw`, `transferTo` | La cuenta cambia su saldo y devuelve el movimiento: no puede haber saldo sin registro |
| Máquina de estados | `AccountStatus.canTransitionTo` | Transiciones permitidas en un `switch` exhaustivo; `CANCELLED` es terminal |
| Command y DTO | `*Command`, `*Request.toCommand()`, `*Response.from()` | El contrato HTTP y el del caso de uso evolucionan por separado |
| Data Mapper | `*PersistenceMapper` | Entidad JPA y entidad de dominio separadas |
| Jerarquía de excepciones | `DomainException` → `NotFoundException` / `ConflictException` | Cada excepción elige su status HTTP al heredar |

### Frontend

| Patrón | Dónde | Para qué |
|---|---|---|
| Contenedor y presentacional | `AccountsPage` / `AccountsTable`, `TransactionsPage` / `TransactionsTable` | La página obtiene los datos; la tabla solo los pinta |
| Adapter | `shared/api/http.ts` | Traduce `fetch` y `ProblemDetail` a `ApiError`; el resto del front no conoce el formato de error |
| Custom hooks | `features/*/hooks.ts` | Encapsulan consultas, mutaciones e invalidación de caché |
| Fábrica de claves | `clientKeys`, `accountKeys`, `transactionKeys` | Las claves de caché en un solo lugar; invalidar por prefijo refresca todas las listas |
| Reverse proxy | nginx (`/api`), CloudFront | Un solo origen para front y API |

## Principios SOLID

- **S (responsabilidad única):** cada clase tiene un motivo para cambiar. `Account` decide las reglas, `AccountService` orquesta (buscar, aplicar, guardar), `AccountController` traduce HTTP, el adaptador persiste y el decorador maneja la transacción.
- **O (abierto/cerrado):** `GlobalExceptionHandler` tiene un método por categoría (`NotFoundException` → 404, `ConflictException` → 409, `DomainException` → 400) y no conoce las excepciones concretas. Al agregar transacciones aparecieron `INSUFFICIENT_FUNDS` y `ACCOUNT_NOT_ACTIVE`, y el handler no se modificó.
- **L (sustitución de Liskov):** `TransactionalAccountUseCase` y `AccountService` implementan `AccountUseCase`. El controller recibe cualquiera de los dos y funciona igual.
- **I (segregación de interfaces):** los puertos son pequeños y por responsabilidad. `AccountNumberGenerator` está separado de `AccountRepository`; en los tests del servicio cada uno se simula por su lado.
- **D (inversión de dependencias):** los servicios dependen de interfaces definidas en `application` (`port.out`) y la infraestructura las implementa. Lo garantiza la estructura de módulos: `application` no puede ver `infrastructure`.

## ACID

Cada caso de uso corre en una sola transacción de base de datos. La frontera la pone el decorador `Transactional*UseCase`, alrededor del caso de uso completo y no de cada consulta.

- **Atomicidad:** una transferencia actualiza dos cuentas e inserta dos movimientos. Si algo falla en la mitad, se revierte todo: no queda un débito sin su crédito.
- **Consistencia:** las reglas se validan en el dominio y otra vez en la base de datos (`CHECK`, `UNIQUE`, claves foráneas). Ningún saldo queda fuera de su cupo, aunque falle la aplicación.
- **Aislamiento:** antes de mover dinero, el servicio bloquea las cuentas con `SELECT ... FOR UPDATE` (bloqueo pesimista). Dos retiros simultáneos sobre la misma cuenta se ejecutan uno detrás del otro y ninguno pisa el saldo del otro (*lost update*). En una transferencia las dos cuentas se bloquean en orden de id ascendente, así dos transferencias cruzadas (A → B y B → A) no se bloquean mutuamente (*deadlock*).
- **Durabilidad:** PostgreSQL confirma la transacción en su registro (WAL) antes de responder, y los datos viven en un volumen persistente.

Se eligió bloqueo pesimista y no optimista porque, con dinero, la contención sobre una misma cuenta es esperable: es mejor esperar el turno que fallar y reintentar.

`TransactionAcidIntegrationTest` lo demuestra contra un PostgreSQL real (Testcontainers):

| Test | Qué demuestra |
|---|---|
| `transfer_whenFailingAfterDebitIsWritten_rollsBackBothAccounts` | Atomicidad: falla el segundo guardado y ninguna de las dos cuentas cambia |
| `concurrentWithdrawals_neverLoseAnUpdateNorOverdrawSavings` | Aislamiento: 40 retiros simultáneos sobre un saldo que alcanza para 30; se aceptan exactamente 30 y el saldo queda en $ 0 |
| `concurrentCrossedTransfers_completeWithoutDeadlockAndKeepTheTotal` | Sin deadlocks: 40 transferencias cruzadas terminan todas y la suma de los saldos no cambia |

Cada test se validó rompiendo a propósito lo que protege (quitar `@Transactional`, quitar el `FOR UPDATE`, quitar el orden de bloqueo): en los tres casos el test correspondiente falló.

## Base de datos

```mermaid
erDiagram
    clients ||--o{ accounts : "tiene"
    accounts ||--o{ transactions : "registra"
    accounts ||--o{ transactions : "contraparte"
    clients {
        bigint id PK
        varchar identification_type
        varchar identification_number
        varchar first_name
        varchar last_name
        varchar email
        date birth_date
        timestamp created_at
        timestamp updated_at
    }
    accounts {
        bigint id PK
        varchar account_type
        varchar number UK
        varchar status
        numeric balance
        numeric overdraft_limit
        boolean gmf_exempt
        bigint client_id FK
        timestamp created_at
        timestamp updated_at
    }
    transactions {
        bigint id PK
        bigint account_id FK
        varchar transaction_type
        varchar direction
        numeric amount
        numeric balance_after
        bigint counterparty_account_id FK
        uuid reference
        timestamp created_at
    }
```

El esquema lo crea y versiona **Flyway** al arrancar la API. Hibernate solo lo valida (`ddl-auto: validate`) y nunca lo modifica.

| Migración | DDL | DML |
|---|---|---|
| `V1__create_clients` | Tabla `clients` con `UNIQUE` de identificación y `CHECK` de edad, correo y longitud de nombres | — |
| `V2__create_accounts` | Tabla `accounts`, FK a `clients` con `ON DELETE RESTRICT`, `CHECK` por tipo y estado, índice único parcial para la exención de GMF y una secuencia por tipo de cuenta | — |
| `V3__add_overdraft_limit_to_accounts` | Columna `overdraft_limit` y `CHECK` del saldo contra el cupo | `UPDATE` que asigna el cupo a las cuentas corrientes ya existentes |
| `V4__create_transactions` | Tabla `transactions` con FK a la cuenta y a la contraparte, `CHECK` de coherencia (consignación = crédito, retiro = débito, contraparte solo en transferencias) e índice para el estado de cuenta | — |

Decisiones:

- **Montos en `NUMERIC(19,2)`** y `BigDecimal` en Java: nunca `double` para dinero.
- **Las migraciones no se editan una vez publicadas:** un cambio es una migración nueva (`V3` agregó el cupo sobre datos que ya existían).
- **El saldo disponible no se guarda:** se calcula como saldo + cupo, y así no puede quedar desactualizado.
- **El estado de cuenta no recalcula saldos:** cada movimiento guarda su `balance_after`.

## Tests y CI

| Capa | Tests | Herramientas |
|---|---|---|
| Dominio | `AccountTest`, `AccountTransactionsTest` | JUnit 5, AssertJ |
| Service | `ClientServiceTest`, `AccountServiceTest`, `TransactionServiceTest` | Mockito, `Clock` fijo |
| Controller | `ClientControllerTest`, `AccountControllerTest`, `TransactionControllerTest` | `@WebMvcTest` + `@MockitoBean` |
| Integración | `TransactionAcidIntegrationTest` | `@SpringBootTest` + Testcontainers (PostgreSQL 17) |
| Frontend | Hooks, esquemas, páginas y diálogos | Vitest, Testing Library, user-event |

Cada capa prueba su responsabilidad: el test del controller verifica que una excepción se convierta en el status HTTP correcto, no la regla de negocio, que ya prueba el servicio.

En total son 131 tests en el backend y 112 en el frontend. Los tres services y los tres controllers tienen el 100 % de sus líneas cubiertas.

`./mvnw verify` falla si un **service** o un **controller** baja del **80 % de líneas cubiertas** (JaCoCo, regla por clase). Así el requisito de cobertura de esas capas lo hace cumplir el pipeline.

El pipeline de GitHub Actions ([`ci.yml`](.github/workflows/ci.yml)) se ejecuta en cada PR y push hacia `develop` y `main`:

| Job | Qué hace |
|---|---|
| `backend` | `./mvnw clean verify`: compila, ejecuta los tests (incluido Testcontainers), verifica la cobertura y publica el reporte de JaCoCo |
| `frontend` | Lint, tests y build con chequeo de tipos |
| `docker` | Levanta el `docker-compose.yml` real y prueba de punta a punta la API de clientes, cuentas y transacciones, y el front con su proxy |

## Git flow

| Rama | Uso |
|---|---|
| `main` | Versiones publicadas, cada una con su tag (`v0.1.0`, `v0.2.0`) |
| `develop` | Integración |
| `feature/*` | Una funcionalidad por rama (`feature/clients`, `feature/transactions-ui`...) |
| `release/x.y.z` | Preparación de una versión: sube el número de versión y se integra a `main` y de vuelta a `develop` |
| `hotfix/*` | Correcciones urgentes sobre `main` |

- Commits y títulos de PR en **Conventional Commits** con scope: `feat(accounts): ...`, `fix(clients): ...`, `ci(workflow): ...`.
- Las features se integran a `develop` por pull request con **merge commit** (sin squash ni rebase), para que el historial conserve cada commit y el grafo muestre las ramas.
- Ningún PR se integra sin el CI en verde.

## Despliegue en AWS

```
Navegador ──HTTPS──> CloudFront ──HTTP──> EC2 (docker compose)
                                           ├─ web: front + proxy /api
                                           ├─ api: Spring Boot
                                           └─ db:  PostgreSQL
```

- **CloudFront** recibe todo el tráfico, pone el HTTPS y cachea los archivos del front.
- **EC2** (`t3.micro`) ejecuta el mismo `docker-compose.yml` del proyecto más el override `docker-compose.prod.yml`, que usa las imágenes publicadas en GitHub Container Registry.
- La instancia solo acepta tráfico de CloudFront, no tiene SSH (se administra con Session Manager) y la base de datos no expone puertos.
- La infraestructura está definida en [`deploy/aws-stack.yml`](deploy/aws-stack.yml) (CloudFormation).
- Las imágenes se construyen una sola vez en GitHub Actions y la instancia solo las descarga: lo que se prueba es exactamente lo que se despliega.

Decisiones:

- **PostgreSQL en la EC2 y no en RDS:** RDS duplicaba el costo de una demo. Como la conexión se configura por variables de entorno, pasar a RDS es cambiar `DB_URL`, sin tocar el código.
- **CloudFront delante de la EC2:** da HTTPS sin costo y mantiene front y API en el mismo origen. El hosting estático de S3 por sí solo no puede reenviar `/api` y solo sirve HTTP.

### Publicar una versión

1. Crear el tag de la versión en `main`. El workflow *Publish images* construye y publica las imágenes:

   ```bash
   git tag -a v0.2.0 -m "Release 0.2.0" && git push origin v0.2.0
   ```

2. **Primera vez:** crear la infraestructura. `AppVersion` y `GitRef` solo se usan al crear el stack.

   ```bash
   aws cloudformation deploy --stack-name fms --template-file deploy/aws-stack.yml \
     --capabilities CAPABILITY_IAM --parameter-overrides AppVersion=0.1.0 GitRef=v0.1.0
   ```

3. **Versiones siguientes:** entrar a la instancia con Session Manager y actualizar los contenedores:

   ```bash
   cd /opt/fms
   sudo git fetch --depth 1 origin tag v0.2.0 && sudo git checkout v0.2.0
   sudo sed -i 's/^APP_VERSION=.*/APP_VERSION=0.2.0/' .env
   sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
   sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

La URL de la aplicación se consulta en las salidas del stack (`Url`).

### Costo

Unos USD 12 al mes con la instancia encendida. Apagada, solo se pagan el disco y la IP elástica (unos USD 4 al mes) y se conservan la URL y los datos.

## Mejoras posibles

- **GMF (4 × 1.000):** hoy se registra si la cuenta está exenta, pero no se cobra; el enunciado limita los movimientos a consignación, retiro y transferencia. Sería un movimiento adicional generado en la misma transacción del retiro o la transferencia.
- **Front en S3:** servirlo desde S3 detrás de CloudFront y dejar la EC2 solo con la API.
- **Base de datos gestionada:** RDS con respaldos automáticos y Multi-AZ.
- **Seguridad del origen:** cifrar el tramo CloudFront → EC2 y aceptar solo el tráfico de nuestra distribución.
- **Despliegue continuo:** que el tag de una versión actualice la instancia automáticamente.
- **Autenticación de los trabajadores:** la prueba no la pide; sería un adaptador más (por ejemplo, Spring Security con OAuth2) sin tocar el dominio.
