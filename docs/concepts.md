# Performance Testing Concepts

A reference for the terms and ideas used across this project. Read it before the rest of the documentation.

## 1. Core Vocabulary

| Term | Meaning |
|---|---|
| **Virtual user (VU)** | One simulated user running the test script in a loop. In k6, each VU has its own state. |
| **Iteration** | One full execution of the default function by one VU. |
| **Scenario** | A named workload in k6: which executor runs, how many VUs, for how long, and which function it calls. |
| **Executor** | The k6 mechanism that controls load, such as `ramping-vus` or `constant-arrival-rate`. |
| **Load profile** | The shape of load over time: ramp-up, steady state, ramp-down. Our profiles live in `src/config/profiles/`. |
| **Ramp-up / ramp-down** | Periods where load increases or decreases. They let the system warm up and drain cleanly. |
| **Steady state** | The period where load is constant. Most measurements should come from here. |
| **Think time** | Pause between a user's actions, simulating reading or hesitation. Without it, the test is an unrealistic flood. |
| **Throughput** | Requests completed per second (RPS). |
| **Concurrency** | Number of requests or users in progress at the same moment. |
| **Latency** | Time from sending a request to receiving the full response. |
| **Percentile** | The value below which a given share of requests fall. p95 = 95% of requests were this fast or faster. |
| **Error rate** | Share of requests that failed (unexpected status, timeout, or connection error). |
| **Check** | A condition evaluated on a response, such as status 200. It is recorded as pass or fail and does not stop the test. |
| **Threshold** | A pass/fail rule on a metric, such as `p(95) < 500`. It decides whether the run passes. |
| **Tag** | A label attached to a request. We use `tag name` to group dynamic URLs under one metric. |
| **Metric types** | `Counter` (accumulates), `Gauge` (last value), `Rate` (share of true values), `Trend` (distribution with percentiles). |
| **Baseline** | A recorded result from a known state, used to compare future runs. |
| **Bottleneck** | The component that limits performance first: CPU, memory, database, network, or a lock. |
| **Saturation** | The point where a resource is fully used and latency rises sharply. |
| **Breakpoint** | The load level where the system stops meeting its criteria. Found by stress tests. |
| **SLI / SLO / SLA** | Service Level Indicator (what you measure, e.g., p95 latency), Service Level Objective (the target, e.g., p95 under 500 ms), Service Level Agreement (a contractual promise). |
| **Error budget** | The amount of failure an SLO allows over a period. Once spent, changes slow down. |

## 2. Workload Models

Two models describe how load arrives.

**Closed model:** a fixed number of users. Each user sends a request, waits for the response, thinks, and sends the next one. Load depends on response time. k6 uses this model with `ramping-vus`.

**Open model:** requests arrive at a fixed rate, regardless of how the system responds. k6 uses this model with `constant-arrival-rate` and `ramping-arrival-rate`.

Why it matters: in a closed model, when the system slows down, users send fewer requests, so the test quietly reduces its own pressure. This can hide latency problems. An open model keeps the pressure constant, so queues and slowdowns become visible. For stress tests, the open model is usually more honest.

Little's Law relates the three quantities: **concurrency = arrival rate × average time in the system**. Example: 20 requests per second with an average response of 0.5 s means about 10 requests in flight at any moment. This helps size VUs before a run.

## 3. Why Percentiles and Not Averages

An average hides the slow tail. If 95 requests take 100 ms and 5 take 5 seconds, the average is about 345 ms, which looks acceptable, while 5% of users wait 5 seconds.

Use percentiles:

- **p50 (median):** the typical experience.
- **p95:** the experience of most users, excluding the slowest 5%.
- **p99:** the tail. Important for systems with many requests per user.
- **max:** useful for finding outliers, rarely for pass/fail.

Our thresholds use `p(95)`, so the criteria reflect what most users experience.

## 4. Test Types

| Type | Question | Typical shape |
|---|---|---|
| **Smoke** | Does it work at minimal load? | 1–2 VUs, short duration |
| **Load** | Does it meet expected demand? | Ramp to expected peak, hold |
| **Stress** | Where does it break? | Steps above expected peak until failure |
| **Spike** | Does it survive a sudden surge? | Fast jump, short hold, fast drop |
| **Soak (endurance)** | Does it degrade over time? | Moderate load for a long period |
| **Breakpoint** | What is the maximum capacity? | Ramp until errors or latency exceed the limit |

The strategy document explains which of these we run and where.

## 5. Good Practices

**Design the test**

- Start from a question. Write the question before the script.
- Model real user behavior: which endpoints, in what order, with what think time and what mix.
- Use realistic data: unique users, varied inputs, realistic payload sizes.
- Define pass/fail criteria before running, not after seeing the results.

**Prepare the environment**

- Record the versions of the system under test, the load generator, and the test script.
- Run against a stable environment, and say which one in every report.
- Warm up before measuring. Caches and connection pools fill during the first minutes.
- Keep the load generator away from the bottleneck. A test runner at 100% CPU measures itself, not the system.
- Never run load against shared or production systems without permission.

**Run and analyze**

- Change one variable at a time. Otherwise you cannot attribute the change.
- Repeat important runs. A single run is an anecdote.
- Compare against a baseline, not against intuition.
- Correlate client metrics with server metrics: CPU, memory, database connections, error logs.
- Look at the shape of latency over time, not only totals. A spike at minute 3 has a cause.

**Write the test well**

- Separate checks (record) from thresholds (decide).
- Do not assert exact values in load tests. Assert status codes and structure, and limit latency with thresholds.
- Tag requests with stable names so metrics group correctly.
- Make cleanup idempotent. Running `teardown()` twice must not fail.
- Keep secrets out of the repo. Read them from environment variables.
- Fail fast with `abortOnFail` on critical thresholds during stress tests.

**Keep it professional**

- Document each baseline with its environment, versions, and date.
- Make results reproducible: anyone should be able to rerun the same command.
- Treat thresholds as code. Changes need a reason, recorded in a commit or an ADR.

## 6. Common Pitfalls

| Pitfall | Effect | Mitigation |
|---|---|---|
| Testing with no think time | Unrealistic traffic, misleading numbers | Add think time from real behavior |
| Using averages | Tail latency hidden | Use percentiles |
| Load generator too weak | Results show the test tool's limit | Monitor the generator's CPU and memory |
| Shared test data | Runs interfere with each other | Unique data per VU, cleanup in `teardown()` |
| Cold start included in results | Inflated latency at the start | Warm-up stage, measure steady state |
| Very short runs | Noise dominates | Enough duration for stable percentiles |
| Thresholds set after the run | Results are rationalized | Define criteria first |
| Expected 4xx responses counted as failures | Failure rate inflated, thresholds fail on correct behavior | Declare expected statuses per request with `responseCallback: http.expectedStatuses(...)` |
| Testing a public service at high load | Harms others, risks an IP block | Limit public tests to light load |

## 7. k6 Concepts Used in This Project

- **Options:** the `options` export defines scenarios, thresholds, and global settings.
- **Init context:** code outside the default function runs once per VU at startup. Use it for loading data with `open()` and `SharedArray`.
- **`setup()`:** runs once before the test. Used for shared preparation.
- **`teardown()`:** runs once after the test. Used for cleanup.
- **`handleSummary()`:** receives the run results and returns the output: console text, HTML, or JSON.
- **`group()`:** names a block of requests in the results.
- **`sleep()`:** pauses the VU. Our think time.
- **`SharedArray`:** shares read-only data among VUs without copying it.
- **Modules:** k6 provides its own modules (`k6/http`, `k6/ws`, `k6/grpc`, `k6/browser`). npm packages cannot be imported at runtime.

## 8. Further Reading

- [k6 documentation](https://grafana.com/docs/k6/latest/)
- [k6 test types](https://grafana.com/docs/k6/latest/testing-guides/test-types/)
- [k6 executors](https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/)
- [k6 thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/)
- [Grafana's testing-with-grafana-cloud examples](https://github.com/grafana/testing-with-grafana-cloud)