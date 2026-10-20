# 0006. Write API clients by hand

- Status: Accepted
- Date: 2026-10-18

## Context

QuickPizza publishes an OpenAPI specification, and tools such as `openapi-to-k6` can generate k6 clients from it. Generated code is consistent, but it tends to be verbose, applies the same checks everywhere, and makes the k6 mechanics hard to read. This project is also a learning portfolio, so the reasoning behind each request matters.

## Decision

Write one client per resource in `src/api/` by hand. Each client:

- Builds the URL and the request body from the specification.
- Sets a fixed `tag name` for requests with dynamic URLs.
- Applies checks that reflect the meaning of each response.
- Returns the response, or the value the caller needs, and nothing more.

The OpenAPI specification is the reference, and the clients are reviewed against it when they change.

## Consequences

- Every client is readable, and its checks are explicit.
- The code is maintained by hand. When the API changes, clients must be updated manually.
- Drift from the specification is possible. A later phase may add a contract check that compares clients against the specification.
- The generator remains an option if the number of endpoints grows significantly.

## Alternatives considered

| Option | Reason not chosen |
|---|---|
| `openapi-to-k6` generator | Generated code is verbose and less instructive. Reasonable for large APIs. |
| Generated clients plus hand-written journeys | Splits the logic across two styles, which complicates review. |