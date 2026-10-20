# 0004. Write k6 scripts in JavaScript, without TypeScript

- Status: Accepted
- Date: 2026-10-18

## Context

k6 executes JavaScript modules directly. TypeScript would require a build step, typically a bundler such as esbuild, that transforms source files before k6 runs them. That adds configuration, a compile step in CI, and one more place where things can go wrong. The project's goal includes making the k6 mechanics visible.

## Decision

Write scripts as plain JavaScript ES modules. Use `@types/k6` as a development dependency so the editor provides autocompletion and type hints. No build step is introduced.

## Consequences

- Scripts run directly with `k6 run`, with no compile step.
- Type checking happens in the editor, not as a build gate.
- Runtime code cannot import npm packages. Only k6 modules and URL imports are available.
- Shared helpers must be plain JavaScript modules inside the repo.
- If the codebase grows large enough that type safety at build time becomes necessary, this decision should be revisited in a new ADR.

## Alternatives considered

| Option | Reason not chosen |
|---|---|
| TypeScript with a bundler | Adds a build step and configuration. Valuable at scale, excessive for this project now. |
| Generated TypeScript types via `k6-types` workflow | Same build-step trade-off. |