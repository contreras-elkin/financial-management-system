# syntax=docker/dockerfile:1

# ---------- Stage 1: build (JDK + Maven wrapper) ----------
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# Maven wrapper and poms first: these layers only change when the build config changes
COPY mvnw ./
COPY .mvn .mvn
COPY pom.xml ./
COPY domain/pom.xml domain/
COPY application/pom.xml application/
COPY infrastructure/pom.xml infrastructure/

# Source code
COPY domain/src domain/src
COPY application/src application/src
COPY infrastructure/src infrastructure/src

# The cache mount keeps ~/.m2 between builds, so dependencies are not downloaded again
RUN --mount=type=cache,target=/root/.m2 \
    chmod +x mvnw && \
    ./mvnw -B -q package -DskipTests && \
    cp infrastructure/target/infrastructure-*.jar app.jar

# ---------- Stage 2: runtime (JRE only) ----------
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# Run as a non-root user
RUN groupadd --system app && useradd --system --gid app app
USER app

COPY --from=build /workspace/app.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
