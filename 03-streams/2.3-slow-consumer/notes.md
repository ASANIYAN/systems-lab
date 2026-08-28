# Experiment: 2.3 Slow Consumer

## What am I trying to understand?

Whether backpressure actually occurs and can be observed. In 2.2's
file copier, backpressure is already handled by existing Node
operations internally and cannot really be observed, since the copy
happens too fast to see any pausing.

## What I expected

Setting a callback for processing subsequent chunks inside a timeout
would mean each chunk would not be completed until the timeout
elapses. I expected this to happen for every chunk, not just the
first one.

## What actually happened

Confirmed. Ran a custom Writable stream with a 500ms delay per chunk
against the same 300,000 byte file from 2.1 and 2.2, split into 5
chunks: four chunks of 65536 bytes, and one final chunk of 37856
bytes.

[t=13ms] processing chunk 1 of 65536 bytes...
[t=514ms] done processing chunk 1
[t=516ms] processing chunk 2 of 65536 bytes...
[t=1017ms] done processing chunk 2
[t=1018ms] processing chunk 3 of 65536 bytes...
[t=1519ms] done processing chunk 3
[t=1520ms] processing chunk 4 of 65536 bytes...
[t=2021ms] done processing chunk 4
[t=2021ms] processing chunk 5 of 37856 bytes...
[t=2522ms] done processing chunk 5
[t=2523ms] all done

Chunk 2 did not begin processing until t=516ms, essentially the same
moment chunk 1's callback fired at t=514ms. There was no gap where
chunk 2 started early and then waited. It simply did not start at
all until permitted to. Total runtime was about 2523ms, close to 5
times 500ms, meaning every single chunk was individually gated by
the 500ms delay, not just the first one.

## Why?

A Writable stream's write function receives a callback as one of its
arguments. That callback, not the passage of time and not the
function simply returning, is the only signal that tells the stream
"I am ready for more data." pipe() watches for this signal directly
and will not push another chunk through until callback() actually
fires. Delaying callback() inside setTimeout means the entire
upstream pipeline is genuinely paused for that delay, not just
slowed down or staggered in appearance.

This is the same shape of behavior I already relied on in Meridian's
BullMQ setup, where a worker does not get handed a new job until it
finishes or signals done with the current one. Both systems refuse
to send more work until an explicit "ready" signal is given, rather
than assuming the next unit of work can start on its own schedule.

The real difference is durability. If this Node script crashed
halfway through, chunks 3, 4, and 5 would simply be gone. Nothing
about this Writable stream's pause is saved anywhere. It exists only
in the running process's memory, for as long as that process is
alive. A BullMQ job sitting in Redis is different. If a worker
crashed mid job, that job is still recoverable, since Redis persisted
it independently of the worker process itself. This is the same
durable versus in memory distinction I already found in my 0.4 notes
comparing EventEmitter to BullMQ, showing up again here in a
completely different mechanism.

## What changed?

Before this project, backpressure was something I understood existed
in theory, both from 2.2's file copier and from my own experience
with Meridian. After this project, I have actually watched it happen
with real timestamps, proving it is not just an error prevention
mechanism sitting quietly in the background. It is active,
continuous pacing of an entire pipeline, and the read side's own
speed becomes irrelevant the moment the write side becomes the
bottleneck.

## What did I learn?

- A custom Writable stream is created with new Writable({ write(chunk,
  encoding, callback) { ... } }).
- callback() is the only signal that unblocks the next chunk. Nothing
  else about the write function finishing or time passing matters on
  its own.
- pipe() automatically enforces this pause, without any extra code
  needed on the read side.
- Delaying callback() inside setTimeout proved, with real timestamps,
  that the read side was fully blocked and waiting, not just
  appearing slower.
- The same "do not send more until I say I am ready" pattern shows
  up in very different systems, like a raw Writable stream and a
  BullMQ worker, but the guarantee behind it can be completely
  different: in memory and temporary versus persisted and durable.

## What still doesn't make sense?

I have not tested what happens if the read side is also slow, at the
same time as the write side. I do not know if the two delays would
add together, overlap, or interact in some other way. I also have
not tested calling callback() with an error argument instead of
calling it with nothing, and do not know how that would affect the
pipeline.

## Mental model after experimenting

A pipeline's overall speed is always capped by its slowest stage.
pipe() enforces this automatically through the callback signal, not
through any manual check I have to write myself. The same shape of
"wait for an explicit ready signal" pattern can exist with very
different guarantees underneath it.
