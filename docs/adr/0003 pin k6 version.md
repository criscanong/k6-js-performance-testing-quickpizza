# 0003. Pin k6 to version 2.2.0

- Status: Accepted
- Date: 2026-10-18

## Context

k6 releases frequently. Version 2.0 removed deprecated APIs and commands, and later releases continue to change behavior. Results are only comparable if the same k6 version runs everywhere: on the developer machine, in Docker, and in CI. The developer machine already runs 2.2.0, and the latest release at the time of this decision is 2.3.0.

## Decision

Use **k6 2.2.0** in every place that runs k6:

- The local installation on each developer machine.
- The Docker image, `grafana/k6:2.2.0`, with the tag fixed explicitly.
- The GitHub Actions setup step, with the version fixed explicitly.

Upgrading requires a new ADR, a verification run, and a new baseline.

## Consequences

- Results remain comparable across machines and CI.
- We do not receive new k6 features until we deliberately upgrade.
- Every upgrade has an explicit cost: a new ADR and new baselines.
- Pending verification: the Docker tag `grafana/k6:2.2.0` must be confirmed with `docker pull` before Phase 5. Until then this ADR assumes the tag exists.

## Alternatives considered

| Option | Reason not chosen |
|---|---|
| Latest version everywhere (2.3.0) | Forces an immediate baseline reset. Acceptable later, through a dedicated upgrade. |
| Floating version (`latest`, or no pin) | Different machines would run different versions, making results incomparable. |
| Different versions per environment | Makes local and CI results impossible to compare. |