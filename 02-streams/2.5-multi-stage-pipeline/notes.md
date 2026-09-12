# Experiment: 2.5 Multi-stage Pipeline

## What am I trying to understand?

How data moves through more than one Transform stream.

I want to understand how this chain works:

source
↓
transform A
↓
transform B
↓
transform C
↓
destination

I also want to understand where state should live when one logical
line is split across more than one chunk.

## Mental model before experimenting

I expected `.pipe(destination)` to return the destination stream.
That means each transform can become the next source in the chain.

I understood that the source only provides data. The transforms are
the stages that change the data. The destination only receives the
final result.

I also expected transform B to hold the unfinished line. The source
does not know what a line means. The destination should not need to
fix incomplete data. Transform B knows about lines, so transform B
should keep the leftover text between chunks.

## What I expected

I expected the input:

hello
world
stream chunks
partial lines matter

to become:

OUT: 1: HELLO
OUT: 2: WORLD
OUT: 3: STREAM CHUNKS
OUT: 4: PARTIAL LINES MATTER

I expected transform A to uppercase the text.
I expected transform B to add line numbers.
I expected transform C to add `OUT: ` before each numbered line.

## What actually happened

The input file contained:

hello
world
stream chunks
partial lines matter

After running the pipeline, the output file contained:

OUT: 1: HELLO
OUT: 2: WORLD
OUT: 3: STREAM CHUNKS
OUT: 4: PARTIAL LINES MATTER

The terminal also printed:

pipeline complete

## Why?

Each `.pipe()` call connected one stream to the next stream.

The chain was:

readStream
↓
uppercaser
↓
lineNumberer
↓
prefixer
↓
writeStream

The first transform changed each chunk to uppercase text.

The second transform added line numbers. It had to remember unfinished
line text in `leftover`. This mattered because the read stream used a
small chunk size, so a chunk could end before a full line ended.

When a chunk did not contain a full line, `numberedLines.length` was
0. In that case, the transform called `callback()` with no output.
That meant "I processed this chunk, but I do not have a full line to
send yet."

When the source ended, `flush` ran. If `leftover` still had text,
`flush` treated it as the final line and sent it downstream.

The third transform added `OUT: ` before each completed numbered line.

## What changed?

Before this project, I understood one Transform stream by itself.
Now I understand that multiple Transform streams can be joined into
one pipeline.

I also understand that each transform should own the state for the
meaning it cares about. The line numbering transform cares about
lines, so it owns the leftover partial line.

## What did I learn?

- `.pipe(destination)` returns the destination stream.
- A Transform stream can be both the destination of one pipe and the
  source of the next pipe.
- Chunks are physical pieces of data.
- Lines are logical pieces of data.
- A logical line can be split across multiple chunks.
- A transform can keep state between chunks when it needs to rebuild
  a logical unit.
- `flush` is useful for final leftover data when the source ends.

## What still doesn't make sense?

This pipeline still uses `chunk.toString("utf8")` inside each
transform. I have not tested this with multi byte UTF-8 characters
like `é` or emoji.

Based on the earlier byte work, I still expect this approach can break
if a multi byte character is split across chunks. This project tested
line boundaries, not character boundaries.

## Mental model after experimenting

A pipeline is a chain of small stream stages. Each stage receives data
from the stage before it, changes it, and sends the result to the next
stage.

Chunks are not the same thing as messages or lines. A chunk can stop
in the middle of a logical line. If a transform works with logical
lines, it must remember partial text until the line is complete.

The stream pipeline controls data flow between stages. The transform
logic controls how each stage interprets and changes the data.
