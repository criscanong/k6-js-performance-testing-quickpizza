# 0005. Guard profiles per environment

- Status: Accepted
- Date: 2026-10-18

## Context

The same test code must run against the local container, the Docker Compose network, and the public QuickPizza instance. The public instance is shared, so it must never receive heavy load. A single command with the wrong environment or profile could cause real harm, such as a stress test against a service other people use.

## Decision

- Each environment has one JSON file in `src/config/environments/` containing its base URL and the list of profiles it allows (`allowedProfiles`).
- The loader reads the environment from the `ENV` variable and throws an error if the selected profile is not in that environment's list.
- Credentials are read from environment variables only, never stored in files in the repository.

## Consequences

- Accidental misuse is blocked before any request is sent.
- Adding an environment is a configuration change, not a code change.
- This is a safety net against mistakes, not a security control. Anyone who edits the environment file can change the allowed profiles. The control protects against accidents and is reviewed in pull requests.
- Each environment file adds one more place to keep in sync when URLs change.

## Alternatives considered

| Option | Reason not chosen |
|---|---|
| Separate scripts per environment | Duplicates logic and drifts over time. |
| Command-line flags only | Easy to mistype, with no enforced rule. |
| No guard, rely on discipline | Works until it doesn't, which is the failure we want to prevent. |