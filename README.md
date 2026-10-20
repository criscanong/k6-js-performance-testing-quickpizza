# k6-js-performance-testing-quickpizza

Performance testing framework with [Grafana k6](https://k6.io) against [QuickPizza](https://github.com/grafana/quickpizza): load, stress, spike, and soak scenarios, per-environment configuration, HTML reports, Docker, and CI with GitHub Actions.

> Status: in progress. Phase 0 complete.

## Documentation

- [Concepts](docs/concepts.md): performance testing terms, workload models, and good practices. Read first.
- [Testing strategy](docs/strategy.md): what we do, in what order, and why.
- [Architecture decisions (ADR)](docs/adr/README.md): specific technical decisions, with their reasons.

## Requirements

- Node.js 22 or later
- k6 2.2.0
- Docker

## Getting Started

Run QuickPizza locally:

```bash
docker run -d --name quickpizza -p 3333:3333 ghcr.io/grafana/quickpizza-local:latest
```

Install development tools:

```bash
npm install
```

Verify the environment:

```bash
npm run preflight
```

## Scripts

| Command | What it does |
|---|---|
| `npm run preflight` | Verifies that k6 and QuickPizza respond |
| `npm run lint` | Checks code with ESLint |
| `npm run format` | Formats code with Prettier |
| `npm run format:check` | Checks formatting without changing files |

## Structure

```
src/
├── tests/          # Entry points for each test type
├── scenarios/      # Reusable journeys
├── api/            # API clients, one per resource
├── config/         # Environments, load profiles, and thresholds
├── data/           # Test data
├── lib/            # Shared utilities
└── reporters/      # Report generation
```