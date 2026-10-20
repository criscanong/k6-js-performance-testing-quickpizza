# 0009. Use only free and open-source tooling

- Status: Accepted
- Date: 2026-10-18

## Context

The project is a learning and portfolio project. Anyone must be able to reproduce it without spending money. Many performance testing products have paid tiers, and free tiers change over time.

## Decision

- Use only tools that are free and open source, or that are free to use in this project.
- Evaluate any tool with a free tier before adopting it, and record the decision in a new ADR that states the limits of that tier.
- Do not use paid services in the default workflow.

Tools in use or planned:

| Tool | Purpose | Phase | License |
|---|---|---|---|
| k6 | Load testing | 0 onward | AGPL-3.0 |
| Docker | Running QuickPizza, k6, and the observability stack | 0 onward | Free for this use |
| ESLint, Prettier | Code quality and formatting | 0 onward | MIT |
| GitHub Actions | CI on a public repository | 6 | Free for public repositories |
| Prometheus | Metrics storage from k6 | 7 | Apache-2.0 |
| Grafana OSS | Dashboards | 7 | AGPL-3.0 |
| Gitleaks | Secret scanning in CI | 6 | MIT |
| Hadolint | Dockerfile linting | 5 | GPL-3.0 |
| Trivy | Container image vulnerability scanning | 5 or 6 | Apache-2.0 |
| Renovate or Dependabot | Dependency update pull requests | 6 | Free for GitHub repositories |

Licenses should be verified against each project's repository before adoption.

Not used: Grafana Cloud k6 (free tier with limits, paid beyond them), k6 Cloud, and commercial APM tools.

## Consequences

- The entire project runs on a laptop with Docker, and in CI on GitHub's free runners.
- Test scale is limited by the machine running the tests. Results from a laptop are not directly comparable to results from dedicated infrastructure. Baselines must say where they were produced.
- Self-hosting Prometheus and Grafana adds containers to maintain.
- New tools must go through the evaluation step, which adds time before adopting them.

## Alternatives considered

| Option | Reason not chosen |
|---|---|
| Grafana Cloud k6 | Would allow larger tests, but depends on a paid plan for sustained use. |
| Paid performance platforms | Outside the project's budget. |