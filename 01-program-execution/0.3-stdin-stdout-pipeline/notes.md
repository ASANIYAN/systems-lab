# Experiment: 0.3 stdin/stdout Pipeline

## What am I trying to understand?

Whether stdin/stdout should be modeled as a single value (like argv)
or as something that arrives incrementally over time, and what shape
that data takes before any decoding happens.

## Mental model before experimenting

Guessed stdin behaves like a stream/socket rather than a fixed value.
Guessed a consumer program has no idea what produced its input — it
just sees bytes. Guessed data would be binary, not text, until
explicitly converted.

## What I expected

- stdin requires an event-based API (listen for data arriving),
  not a direct read like argv[2].
- A consumer program (e.g. grep) doesn't know or care whether its
  input came from another program, a typed input, or a file — it's
  all just "bytes on stdin" to it.
- Raw stdin data would be binary (a Buffer), not a string, until
  something explicitly decodes it.
- Data in a pipeline arrives incrementally, piece by piece, not only
  after the producer fully finishes (confirmed by reasoning through
  `tail -f logfile | grep error`, which only works because the
  consumer receives data continuously from a producer that never
  exits).

## What actually happened

Confirmed all of the above.

`echo "hi" | node script.js` with `console.log(chunk)` printed:
`<Buffer 68 69 0a>` — raw bytes, not text. `68`='h', `69`='i',
`0a`=newline (auto-appended by `echo`).

`.toString()` correctly decoded the buffer to plain text using UTF-8
by default — confirms UTF-8 is the shared, agreed-upon mapping from
byte values to characters, the same table any UTF-8-aware program
uses, which is why text moves between unrelated programs correctly.

Built producer.js (process.stdout.write) and consumer.js
(process.stdin.on('data', ...)) as two separate scripts, connected
via shell pipe:

    node producer.js | node consumer.js

First run (consumer used console.log to print the decoded chunk):
hello
(with a trailing newline)

Second run (consumer switched to process.stdout.write instead of
console.log):
hello%
(no trailing newline — the `%` is zsh's own marker indicating the
output had no newline at the end)

This proves the newline seen in the first run came entirely from
console.log's automatic newline-adding behavior on the CONSUMER side
— not from anything producer.js actually sent through the pipe.
producer.js never wrote a newline at all.

## Why?

Streams model data that arrives over time, potentially in pieces,
sometimes with no defined end point at all (tail -f never exits).
This is fundamentally different from argv/process.env, which are
fixed values available in full the instant the program starts. The
event-based `data` API exists specifically to handle "value not yet
fully known, may arrive in fragments" — you attach a listener and
react each time a fragment shows up, rather than reading a value
that's already sitting there complete.

Buffers exist because stdin has no built-in concept of "this is
text" — it's raw bytes by default. Text is a human-imposed
interpretation, applied via .toString() and an agreed encoding
(UTF-8), the same way "flag" vs "string" was a human-imposed
interpretation on top of raw argv strings in 0.1.

console.log and process.stdout.write differ in exactly one
consequential way for this project: console.log silently appends a
newline, process.stdout.write does not. Invisible/implicit bytes
like this matter once byte-level precision is required — which is
exactly what Stage 1's message framing (knowing precisely how many
bytes were sent) will need.

## What changed?

Moved from "stdin is probably some kind of stream" (correct guess,
but abstract) to a concrete, verified understanding of the mechanism:
an event ('data') fires per chunk, each chunk is a Buffer, decoding
to text is a manual step, and console.log's newline is not part of
the actual data — it's output formatting added on the receiving end.

## What did I learn?

- stdin is event-based (`.on('data', ...)`), not a single readable
  value — this is the practical shape of "stream."
- Chunks arrive as Buffer objects: raw bytes, hex-printed by default,
  not text.
- .toString() decodes a Buffer to text via an explicit encoding,
  defaulting to UTF-8 — nothing is auto-decoded.
- A consuming program has no way to know or care what produced its
  stdin — piped program, typed input, or otherwise all look identical.
- Data flows through a pipe incrementally as it's produced, not in
  one batch after the producer exits — proven both by reasoning
  (tail -f can't work otherwise) and directly observed.
- console.log silently adds a trailing newline; process.stdout.write
  does not. This is a formatting choice on the writer's end, not
  something inherent to the data itself.

## What still doesn't make sense?

- Haven't yet tested what happens if producer.js writes MULTIPLE
  separate process.stdout.write() calls in quick succession — does
  the consumer's 'data' event fire once per write() call, or could
  Node merge multiple writes into a single 'data' event (or split
  one write across multiple 'data' events)? This is directly
  relevant to Stage 1's framing problem and worth testing before
  assuming a 1:1 relationship between writes and data events.

## Mental model after experimenting

stdin/stdout are event-driven streams of raw bytes (Buffers), fully
decoupled from whatever produced or will consume them. Data flows
incrementally, not as a single complete value. Any structure imposed
on that data — text decoding, message boundaries, newlines — is
added deliberately by code, never inherent to the raw bytes
themselves. This directly sets up Stage 1 (bytes/buffers) and Stage 2
(streams), both of which formalize ideas already touched here.
