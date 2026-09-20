# Experiment: 3.3 Process Pipeline

## What am I trying to understand?

How to connect multiple separate processes into one pipeline.

I want to understand how this works:

Program A -> Program B -> Program C

I also want to understand what connects the programs together, since
they are separate processes and do not share memory.

## Mental model before experimenting

From Stage 2, I understood stream pipelines inside one process.

From 3.1 and 3.2, I understood that a child process has its own PID,
its own lifecycle, and its own stdout and stdin streams.

Before this experiment, I expected Program A, Program B, and Program C
to be three separate processes. I expected stdout and stdin streams to
connect them.

## What I expected

I expected Program A to print:

hello
world

I expected Program B to uppercase that input:

HELLO
WORLD

I first predicted the final output as:

OUT: hello
OUT: world

That missed Program B's uppercase transform.

After correcting that, I expected the final output to be:

OUT: HELLO
OUT: WORLD

I also expected A, B, and C to have different PIDs.

For the failure case, I expected Program C not to print any `OUT`
lines if Program B exited before writing output.

I expected Program B to close with code 7. I first guessed Program C's
close code might be null, then corrected that expectation. If Program
C simply received no input and ended by itself, I expected Program C to
close with code 0 and signal null.

For the slow mode backpressure test, I expected the pipe to eventually
push back and slow Program A down. I expected this because there should
be a mechanism that stops Program A from writing forever if Program B
is too slow.

## What actually happened

The output was:

program A pid: 17093
program B pid: 17094
program C pid: 17095
OUT: HELLO
OUT: WORLD
program A close code: 0
program A close signal: null
program B close code: 0
program B close signal: null
program C close code: 0
program C close signal: null

The programs had different PIDs.

The final output matched the corrected prediction:

OUT: HELLO
OUT: WORLD

All three programs closed with code 0 and signal null.

Then I ran the pipeline with Program B set to fail before writing
output.

The output was:

program A pid: 17916
program B pid: 17917
program C pid: 17918
mode: fail
program B stderr: program B failed before writing output
program A close code: 0
program A close signal: null
program B close code: 7
program B close signal: null
program C close code: 0
program C close signal: null

There were no `OUT` lines.

Program B failed with code 7.

Program C still closed with code 0 and signal null.

Then I ran slow mode. Program A wrote 200000 lines. Program B forwarded
chunks slowly. Program C counted the lines instead of printing them all.

Important parts of the output were:

program A pid: 18650
program B pid: 18651
program C pid: 18652
mode: slow
program A stderr: program A backpressure at line 32629
program A stderr: program A drain at line 32629
program A stderr: program A backpressure at line 44544
program A stderr: program A drain at line 44544
program A stderr: program A backpressure at line 56459
program A stderr: program A drain at line 56459
program A stderr: program A finished writing 200000 lines
program C received 200000 lines
program A close code: 0
program A close signal: null
program B close code: 0
program B close signal: null
program C close code: 0
program C close signal: null

The real output had many more repeated backpressure and drain lines.
The important pattern was that Program A had to stop and wait many
times before finishing.

## Why?

Program A wrote text to its stdout.

The runner connected Program A's stdout to Program B's stdin:

programA.stdout.pipe(programB.stdin)

Program B read from stdin, uppercased the text, and wrote the result
to stdout.

The runner connected Program B's stdout to Program C's stdin:

programB.stdout.pipe(programC.stdin)

Program C read from stdin, added `OUT: ` before each line, and wrote
the result to stdout.

The runner connected Program C's stdout to the parent process stdout:

programC.stdout.pipe(process.stdout)

The programs did not share memory. Data crossed from one process to
the next through stdout and stdin streams.

In the failure run, Program B exited before writing anything to stdout.
That meant Program C did not receive useful input.

Program C did not fail. It simply reached the end of its stdin and
closed normally.

This means the parent cannot judge the whole pipeline only by the last
process. The parent must observe every process in the pipeline.

In the slow mode run, Program B processed input slowly. Program A wrote
until the downstream buffers filled. At that point,
`process.stdout.write()` returned false in Program A.

Program A waited for the `drain` event before continuing. This showed
that backpressure crossed the process boundary.

Program C received all 200000 lines, so the pipeline slowed down
without losing data.

## What changed?

Before this project, I understood stream pipelines inside one process.
Now I understand that separate processes can also be composed into a
pipeline.

The connection is not a function call or shared memory. The connection
is stream data moving through stdout and stdin.

I also understand that a failed middle process does not automatically
make the final process fail.

I also understand that backpressure can work across separate processes,
not only inside one Node process.

## What did I learn?

- A process pipeline can connect separate programs together.
- Each program in the pipeline has its own PID.
- stdout from one process can become stdin for another process.
- `stdio: ["ignore", "pipe", "pipe"]` means stdin is unused, stdout is
  piped, and stderr is piped.
- `stdio: ["pipe", "pipe", "pipe"]` means the parent can connect to the
  child's stdin, stdout, and stderr.
- A process pipeline can transform data in stages, similar to a stream
  pipeline inside one process.
- The important difference is that each stage is an independent process.
- A middle process can fail while the final process still exits with
  code 0.
- The parent must monitor all stages, not only the final stage.
- Backpressure can cross process boundaries through stdout and stdin.
- `write()` returning false means Program A should stop writing until
  `drain` fires.
- Buffers allow some data to move quickly at first, but they do not
  allow unlimited writing.

## What still doesn't make sense?

I have not tested what happens when the final process is the slowest
stage instead of the middle process.

## Mental model after experimenting

A process pipeline is a stream pipeline where each stage is its own
process.

Each process is independent, but stdout and stdin can connect them.
Data moves from one process to the next as stream chunks.

The parent process is the coordinator. It starts the programs and wires
their streams together. It also has to watch each stage, because the
last stage can finish normally even when an earlier stage failed.

A process pipeline still follows stream flow control. If a downstream
stage is too slow, upstream writing eventually pauses until there is
room again.
