# Performance Testing Strategy with k6

This document explains **what** we are building in this project, **in what order**, and **why**. Specific technical decisions live in [`docs/adr/`](adr/). Terms such as VU, percentile, or open model are defined in [`docs/concepts.md`](concepts.md).

## 1. Goal

Build a performance testing framework with Grafana k6 that resembles a real team's setup: separated by responsibility, configurable per environment, with reports, runnable in Docker, and validated in CI.

The tests do not aim only to confirm that the system responds. They answer concrete questions: Does each endpoint work under load? How much load can the system handle? How does it react to a sudden spike? Does it degrade over time?

## 2. System Under Test

[QuickPizza](https://github.com/grafana/quickpizza) is a demo application from Grafana, built to teach k6. Its OpenAPI specification lives in the source repo and is the reference for every client we write.

| Environment | Base URL | Use |
|---|---|---|
| Local (Docker) | `http://localhost:3333` | All tests, including load and stress |
| Public | `https://quickpizza.grafana.com` | Smoke and light load only, never stress or soak |

Reason: the public instance is shared with other people. Load on it can affect them and can get our IP blocked.

The image version is pinned by tag when the project requires it. Changes in QuickPizza shift the baseline, so every baseline records the version it was measured against.

## 3. Phases and Why They Run in This Order

Each phase depends on the one before it. We do not move on until the acceptance criterion is met.

| Phase | What we do | Why it goes here |
|---|---|---|
| 0. Setup | Repo, tooling, QuickPizza running, preflight green | If the environment is broken, no later result is valid |
| 1. Isolated endpoint tests | Each endpoint alone, with one virtual user. Happy path plus at least one error case | Confirms each client and its checks are correct before we combine them |
| 2. Journeys and data | Flows that chain endpoints, `setup()`, unique users, cleanup in `teardown()` | Simulates a real user and keeps runs from contaminating each other |
| 3. Test types | Smoke, load, stress, spike, and soak, with thresholds and a baseline | This is where the performance questions get answered |
| 4. Reports | Console, HTML dashboard, `handleSummary` | Results must be readable and comparable |
| 5. Docker | Compose with QuickPizza, k6, and reports in `reports/` | Same result on any machine |
| 6. CI/CD | Smoke on every PR, nightly load, manual runs | Tests run on their own and block changes that make performance worse |
| 7. Observability | Prometheus and Grafana with dashboards (optional) | Live metrics, correlated with the application |
| 8. Documentation | README, ADRs, SLOs | A project without explanation cannot be understood or evaluated |

### Why isolated endpoint tests come before journeys

If a journey fails, we cannot tell whether the registration, the login, the rating, or the check itself failed. Testing each endpoint alone removes that ambiguity. A journey is then just a sum of endpoints we have already verified.

## 4. Code Organization

```
src/
├── tests/        # Entry points: smoke, load, stress, spike, soak
├── scenarios/    # Reusable journeys: register, order a pizza, rate
├── api/          # One client per resource: users, pizza, ratings, catalogs
├── config/
│   ├── environments/   # local.json, docker.json, public.json
│   ├── profiles/       # Load profiles per test type
│   └── thresholds.js   # Centralized thresholds
├── data/         # Test data
├── lib/          # Utilities: shared checks, user generation
└── reporters/    # handleSummary
```

Responsibilities:

- **Client (`api/`):** knows how to call one endpoint. It makes the request, applies checks, and sets a fixed `tag name`. It knows nothing about VUs, duration, or which environment it runs in.
- **Journey (`scenarios/`):** knows the order in which to call the clients. It knows nothing about URLs or load profiles.
- **Profile (`config/profiles/`):** defines how many users, for how long, and at what pace. A test only selects a profile.
- **Entry point (`tests/`):** connects a journey, a profile, and an environment.

This separation lets us change one piece without touching the others. For example, raising the load does not require rewriting a journey.

## 5. Environments

One JSON file per environment, selected with the `ENV` variable. Each environment declares its base URL and the profiles it allows.

- `local` and `docker`: all profiles.
- `public`: smoke and light load only.

A guard in the code blocks any profile not allowed in the selected environment. This prevents running a stress test against the public instance by accident.

Credentials never go into the repo. They are read from environment variables, and `.env` is in `.gitignore`.

## 6. Test Types

| Type | Question it answers | Load | Where it runs |
|---|---|---|---|
| Smoke | Does the basics work? | 1–2 VUs, 1 min | All environments; CI on every PR |
| Load | Does it handle expected load? | Gradual ramp to 20–50 VUs, 5–10 min | Local and Docker |
| Stress | How much can it handle? | Increasing steps until failure | Local and Docker |
| Spike | How does it react to a sudden peak? | Abrupt jump from a few to many VUs | Local and Docker |
| Soak | Does it degrade over time? | Moderate load, 30–60 min | Local and Docker |

Load models:

- **`ramping-vus`:** simulates users arriving and leaving.
- **`constant-arrival-rate`:** fixes requests per second, regardless of how long the system takes to respond.

## 7. Test Data

- **Unique users:** each VU creates its own user with a random name. This way VUs do not collide with each other or with existing data.
- **Cleanup:** `teardown()` deletes what the run created. The database in the container persists between runs, so without cleanup tests contaminate each other.
- **No fixed IDs:** journeys never depend on a rating having a specific ID.
- **Traffic mix:** tests combine reads and writes, for example 70% queries and 30% ratings, to resemble real usage.

## 8. Thresholds and Pass/Fail Criteria

A threshold decides whether a run passes or fails. A check only measures and records.

- **Global:** `checks > 99%`, and `http_req_failed < 1%` on requests that were expected to succeed.
- **Expected errors:** k6 counts any status of 400 or higher as a failed request by default. Error cases a test expects (for example, a duplicate registration returning 400) must declare their expected status on that request with `responseCallback: http.expectedStatuses(400)`. Otherwise they inflate the failure rate and make a correct system look broken.
- **Per endpoint:** latency thresholds by `tag name`, so a slow endpoint is not hidden behind the overall average.
- **Baseline-driven:** initial values are starting points. We measure first, then adjust, and the results go into `docs/baseline.md`.

Thresholds are not guessed. They come from what the environment actually measures, and each value's reason is documented.

## 9. Reports

- **Console:** summary at the end of each run, useful in CI.
- **HTML dashboard:** `reports/html-report.html`, generated by k6's built-in web dashboard.
- **`summary.json`:** structured result for comparing runs across commits.
- **Grafana (optional):** live time-series, in phase 7.

Each report name includes the environment, the profile, and the date, so runs can be compared.

## 10. Docker and CI

- **Docker Compose:** runs QuickPizza and k6 on the same network. The base URL inside Compose is `http://quickpizza:3333`.
- **CI:** three workflows.
  - `pr-smoke`: on every pull request. If a threshold fails, the PR turns red.
  - `nightly-load`: scheduled load against the `docker` environment.
  - `manual-run`: manual execution, with environment and profile as inputs.

The k6 version is pinned in Docker and in CI. For this project: **k6 2.2.0**.

## 11. Architecture Decisions

Every significant decision gets an ADR in `docs/adr/`. Examples of decisions that must be documented:

- Why QuickPizza instead of a third-party public API.
- Why the per-environment profile guard.
- Why handwritten clients instead of clients generated from OpenAPI.
- Why k6 2.2.0.

## 12. Free Tooling

Every tool in this project is free to use, following [ADR 0009](adr/0009-free-tooling-only.md). Beyond k6 and Docker, the planned additions are:

- **Prometheus and Grafana OSS** (phase 7): live metrics and dashboards.
- **Gitleaks** (phase 6): blocks commits that contain secrets.
- **Hadolint** and **Trivy** (phases 5–6): lint the Dockerfile and scan images for known vulnerabilities.
- **Renovate or Dependabot** (phase 6): proposes dependency updates as pull requests.

Each addition is evaluated before adoption and recorded in an ADR.

## 13. What We Do Not Do

- We do not run stress, spike, or soak tests against the public instance.
- We do not run load tests in the CI for every PR. Only smoke.
- We do not store credentials or secrets in the repo.
- We do not use TypeScript in this version. k6 scripts run directly, without a build step.