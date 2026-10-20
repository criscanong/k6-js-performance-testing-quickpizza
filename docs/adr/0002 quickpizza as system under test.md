# 0002. Use QuickPizza as the system under test

- Status: Accepted
- Date: 2026-10-18

## Context

Performance tests need an API that behaves like a real application: it has state, authentication, several resources, and more than one protocol. It must be free, runnable locally, and not controlled by a third party whose data or availability can change without notice.

## Decision

Use [QuickPizza](https://github.com/grafana/quickpizza), Grafana's demo application, as the primary system under test. It is run locally from its published Docker image, and its public instance is used only for light tests (see ADR 0005).

## Consequences

- The API covers users, login tokens, a recommendation engine, catalogs, and ratings with full CRUD, which allows realistic journeys.
- It exposes REST, WebSocket, and gRPC, so the framework can grow beyond HTTP.
- An OpenAPI specification exists and serves as the reference for every client.
- Its data persists inside the container. Tests must create unique data and clean up (see the strategy document).
- The image tag `latest` can change behavior. Baselines must record the image version used.
- The public instance is shared. We never run stress, spike, or soak tests against it.

## Alternatives considered

| Option | Reason not chosen as primary |
|---|---|
| Swagger Petstore | Public and shared. Good as a secondary API for reuse, but its data is modified by everyone and can fail under load. |
| JSONPlaceholder, Restful-Booker | Simple or partially stateful. Useful for exercises, not for a realistic journey. |
| Our own API | Would consume project time that belongs to testing. |
| Mock servers only | Test the client, not a system with real behavior. |