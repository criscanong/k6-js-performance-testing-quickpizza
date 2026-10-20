# 0007. Test endpoints in isolation before journeys

- Status: Accepted
- Date: 2026-10-18

## Context

A journey chains several endpoints: register, log in, create a rating, read it, delete it. When a journey fails, the cause could be any step, the data, the timing, or the check itself. Diagnosing this at the same time as writing the journey slows everything down and hides mistakes.

## Decision

Phase 1 tests each resource alone, with one virtual user, covering at least one successful case and one error case (400, 401, or 404 where the specification defines it). Only after every client is verified does Phase 2 combine them into journeys.

## Consequences

- A failure points to one client and one endpoint.
- Clients are verified against the real API before they are reused, so journeys inherit tested building blocks.
- More work at the start, before any load is applied.
- Isolated tests also serve as the first regression suite when the API changes.

## Alternatives considered

| Option | Reason not chosen |
|---|---|
| Journeys first | Fast to see something run, slow to diagnose when it fails. |
| Unit tests on the clients only | Clients cannot be verified without the real API, so the check would be incomplete. |