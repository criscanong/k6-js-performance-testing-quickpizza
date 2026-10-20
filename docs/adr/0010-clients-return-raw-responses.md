# Architecture Decision Records

Each ADR records one significant decision: the context that required it, the choice made, and its consequences.

ADRs are not rewritten. If a decision changes, a new ADR is created and marks the old one as superseded.

## Index

| # | Decision | Status |
|---|---|---|
| [0001](0001-use-k6.md) | Use Grafana k6 as the load testing tool | Accepted |
| [0002](0002-quickpizza-as-system-under-test.md) | Use QuickPizza as the system under test | Accepted |
| [0003](0003-pin-k6-version.md) | Pin k6 to version 2.2.0 | Accepted |
| [0004](0004-javascript-without-typescript.md) | Write k6 scripts in JavaScript, without TypeScript | Accepted |
| [0005](0005-environment-profile-guard.md) | Guard profiles per environment | Accepted |
| [0006](0006-handwritten-api-clients.md) | Write API clients by hand (client checks amended by 0010) | Accepted |
| [0007](0007-endpoint-tests-before-journeys.md) | Test endpoints in isolation before journeys | Accepted |
| [0008](0008-reports-web-dashboard-and-handlesummary.md) | Generate reports with the web dashboard and `handleSummary` | Accepted |
| [0009](0009-free-tooling-only.md) | Use only free and open-source tooling | Accepted |
| [0010](0010-clients-return-raw-responses.md) | Clients return raw responses; tests own the checks | Accepted |

## Template

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context
What situation forces a decision?

## Decision
What we chose, stated directly.

## Consequences
What becomes easier, what becomes harder, what we must maintain.

## Alternatives considered
What we rejected and why.
```