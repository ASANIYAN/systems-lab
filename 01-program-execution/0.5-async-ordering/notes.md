# Experiment: 0.5 Async Ordering

## What am I trying to understand?

Whether async callbacks (setTimeout vs Promise) run in source order,
and if not, what actually determines execution order — including
whether microtask priority is a one-time check or something stronger.

## Mental model before experimenting

Already had the correct model going in from prior work with async
pipelines (Meridian, Veritas): synchronous code runs first, top to
bottom; setTimeout goes into the macrotask queue; Promises go into
the microtask queue; microtasks are drained with higher priority
than macrotasks.

## What I expected

- Synchronous logs (A, D) run first and in source order.
- setTimeout(..., 0) callback (B) runs LAST, despite the 0ms delay,
  because it's a macrotask queued to run only after the current
  synchronous execution AND all microtasks finish.
- Promise .then() callback (C) runs before B, because microtasks
  take priority over macrotasks.
- Predicted order: A, D, C, B.

Second test: predicted that a microtask scheduled from INSIDE another
already-running microtask (C1 scheduling C2) would still run before
the macrotask (B) — testing whether microtask draining is a one-time
check or a full drain that re-checks for newly added microtasks.

## What actually happened

First run: A, D, C, B — exact match.

Second run (nested microtask): A, D, C1, C2, B — also exact match.
C2 was scheduled only once C1 was already executing, i.e. AFTER the
program had moved past D — and it still ran before B.

## Why?

The event loop doesn't check the microtask queue once per cycle and
move on — it keeps draining it until it is genuinely empty, even if
new microtasks get added mid-drain. Only once the microtask queue is
fully empty does the event loop allow a macrotask (setTimeout,
setInterval, I/O callbacks) to run. This is a stronger guarantee than
"higher priority" — it's "always completely empties first, no matter
how many new microtasks get chained in along the way."

This directly explains behavior I'd already seen in Meridian/Veritas
without having isolated the mechanism this precisely before: chained
.then() calls or sequential awaits in an async pipeline always
resolve fully before any timer-based or I/O-based callback gets a
turn, which is part of why async pipelines built on Promises feel
"immediate" relative to anything timer-based, even when there are
several chained steps.

## What changed?

Moved from "I know Promises beat setTimeout" (already correct) to
having directly proven the STRONGER claim: microtask draining is
exhaustive and re-checked, not a single pass. This matters for
reasoning about any pipeline with deeply chained .then()/await steps
racing against a timer or I/O callback — no amount of microtask
chaining will ever let a macrotask cut in early.

## What did I learn?

- Sync code always fully completes before ANY async callback runs,
  regardless of delay value.
- setTimeout(fn, 0) does not mean "immediately" — it means "as soon
  as possible AFTER the microtask queue is fully drained."
- The microtask queue is drained exhaustively, including microtasks
  added during the drain itself — not just checked once.
- This is the same event-loop mechanism underlying async pipeline
  behavior already used in Meridian and Veritas, just not previously
  isolated and proven this explicitly.

## What still doesn't make sense?

- Haven't tested how this interacts with actual I/O (e.g. fs.readFile
  callbacks) rather than just setTimeout — I/O callbacks are also
  macrotasks but run in a different phase of the event loop than
  timers. Worth revisiting once Stage 2 (streams) or Stage 8
  (concurrency) covers I/O-driven callbacks directly, to confirm
  whether the same "microtasks fully drain first" rule holds there
  too.

## Mental model after experimenting

The event loop treats microtasks as a queue that must be completely
emptied — including anything newly added during the drain — before a
single macrotask callback runs, regardless of how small a macrotask's
delay is. This isn't just "microtasks go first," it's "microtasks
ALWAYS go first, exhaustively, every single cycle." Sync code, then
full microtask drain, then one macrotask, then the cycle repeats.
