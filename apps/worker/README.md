# @saiyan/worker

Minimal BullMQ worker for Saiyan Ascend.

## Milestone 1 behaviour

- Connects to Redis via `REDIS_URL`
- Registers a **noop** `heartbeat` processor on queue `saiyan-health`
- Emits structured heartbeat logs

**Real notification dispatch is not implemented here.** Later milestones add
outbox consumers, preference-aware scheduling, push/email adapters, and
delivery-state reporting.

## Run

```bash
pnpm docker:up
pnpm worker:dev
```
