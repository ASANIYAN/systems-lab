# Experiment: 0.4 Event Experiment

## What am I trying to understand?

The actual mechanism behind "one part emits, another reacts" —
specifically, whether events are stored/checked (polling) or pushed
directly and immediately (true event-driven), and what happens to an
emitted event if nothing is listening at that moment.

## Mental model before experimenting

Initially conflated "event" with "a value that gets checked later" —
assumed something like a key holding data that gets polled. Also
assumed, from Meridian's event-driven feel, that an emitted event
wouldn't simply disappear if nothing was listening yet.

## What I expected

- Emitting before any listener is attached: nothing happens, no error,
  no queued delivery.
- Emitting after a listener is attached: the listener fires
  immediately and synchronously.

## What actually happened

Confirmed both predictions exactly. Ran two emits back to back:

- emit('created', {id:1}) BEFORE any .on() was registered → no
  output at all, no trace of it anywhere.
- emit('created', {id:2}) AFTER .on('created', ...) was registered →
  listener fired immediately, printed `received: { id: 2, ... }`.

Only one line of output total. The absence of any trace of id:1 is
the actual proof — EventEmitter has no memory and no delivery
guarantee. An emit with no listener is not queued, not retried, not
logged anywhere — it simply does nothing.

## Why?

EventEmitter is fire-and-forget: .emit() directly and synchronously
calls whatever listener functions are CURRENTLY registered for that
event name, at the exact moment .emit() runs. There is no storage
layer underneath it — it is closer to a phone ringing than a mailbox
holding messages.

This directly explains what surprised me: I expected Meridian-style
persistence, but Meridian's actual "doesn't vanish" behavior comes
from BullMQ, which is backed by Redis and genuinely persists jobs
until a worker is ready — a completely different guarantee than plain
EventEmitter provides. Meridian likely uses BOTH patterns
deliberately: BullMQ where delivery must survive delays or process
restarts, and something closer to plain in-process events (or Redis
pub/sub, which is ALSO fire-and-forget/no-persistence, much like
EventEmitter) where instant notification is fine and persistence
would be unnecessary overhead. Worth re-reading Meridian's actual
code to confirm exactly which mechanism is used where — this was
reasoned from memory of the architecture, not re-verified against
the source.

## What changed?

Went from treating "event-driven" as one single concept to
recognizing it's an umbrella term covering mechanisms with very
different guarantees: EventEmitter (no persistence, no memory) vs. a
queue like BullMQ (persistent, survives delay/restart) vs. pub/sub
(no persistence, same category as EventEmitter despite feeling
similar to a queue at a glance).

## What did I learn?

- EventEmitter is synchronous, in-process, fire-and-forget.
- No listener at emit time = event is gone, permanently, silently.
- "Event-driven" is not one mechanism — persistence/delivery
  guarantees vary a lot between EventEmitter, message queues, and
  pub/sub, even though all three get casually called "events."
- Attaching a listener with .on() and emitting with .emit() both act
  on a shared, dedicated EventEmitter instance — producer and
  consumer never need a direct reference to each other, only to the
  shared emitter.

## What still doesn't make sense?

- Haven't tested what happens with MULTIPLE listeners on the same
  event name — do they all fire, in what order, and does one
  listener throwing an error stop the others from running?

## Mental model after experimenting

EventEmitter is instantaneous, synchronous, and memoryless —
structurally the "cheapest" and simplest form of the broader
event-driven pattern. Systems that need delivery guarantees (survive
a crash, survive a delay, survive nobody listening yet) need to layer
something else on top — a queue, a database, a pub/sub broker with
persistence — EventEmitter alone provides none of that.
