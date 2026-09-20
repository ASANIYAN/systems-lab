# Experiment: 3.2 Process Monitor

## What am I trying to understand?

How a parent process can monitor a child process.

I want to understand how the parent can observe:

- normal success
- explicit failure
- termination by signal

I also want to understand the difference between an exit code and an
exit signal.

## Mental model before experimenting

From 3.1, I understood that a child process has its own PID and its
own lifecycle.

I expected the parent to be able to observe the child after starting
it. I expected the parent to see when the child finished, and whether
it finished successfully or failed.

I knew that `process.exit(number)` should produce an exit code. I did
not clearly understand signal based exits yet.

## What I expected

For success mode, I expected:

child exit code: 0
child exit signal: null

For fail mode, I expected:

child exit code: 7
child exit signal: null

For wait mode, my first prediction was:

child exit code: null
child exit signal: null

I thought this because the child would be interrupted by something
outside itself. After reasoning about signals, I corrected the
prediction to:

child exit code: null
child exit signal: SIGTERM

For missing mode, I expected the parent to receive an `error` event
instead of a normal child exit result. I expected this because the
command would not exist, so the operating system could not start a new
process for it.

For `exit` and `close`, I first thought `exit` was only for system or
manual terminal termination. After reasoning about it, I understood
that `exit` should mean the child process ended. I expected `close` to
mean the child process ended and its stdio streams were closed.

## What actually happened

For success mode, the output was:

monitor pid: 11532
started child pid: 11533
mode: success
child stdout: worker pid: 11533
child stdout: worker mode: success
worker completed successfully
child exit code: 0
child exit signal: null

For fail mode, the output was:

monitor pid: 11534
started child pid: 11535
mode: fail
child stdout: worker pid: 11535
child stdout: worker mode: fail
child stderr: worker failed on purpose
child exit code: 7
child exit signal: null

For wait mode, the output was:

started child pid: 12568
mode: wait
child stdout: worker pid: 12568
child stdout: worker mode: wait
worker waiting
sending SIGTERM to child
child exit code: null
child exit signal: SIGTERM

Before changing the monitor, I ran:

node monitor.js missing

The output was:

monitor pid: 13523
started child pid: 13524
mode: missing
child stdout: worker pid: 13524
child stdout: worker mode: missing
child stderr: unknown mode: missing
child exit code: 1
child exit signal: null

This did not test startup failure. It only started the real worker
with an unknown mode.

After changing missing mode to run `not-a-real-command`, the output
was:

monitor pid: 13910
started child pid: undefined
mode: missing
child start error: spawn not-a-real-command ENOENT

After adding a `close` listener, I ran all modes again.

For success mode, the output ended with:

child exit code: 0
child exit signal: null
child close code: 0
child close signal: null

For fail mode, the output ended with:

child exit code: 7
child exit signal: null
child close code: 7
child close signal: null

For wait mode, the output ended with:

child exit code: null
child exit signal: SIGTERM
child close code: null
child close signal: SIGTERM

For missing mode, the output ended with:

started child pid: undefined
mode: missing
child start error: spawn not-a-real-command ENOENT
child close code: -2
child close signal: null

## Why?

In success mode, the worker called:

process.exit(0)

That means the worker ended by itself with a success code.

In fail mode, the worker wrote an error message to stderr and then
called:

process.exit(7)

That means the worker ended by itself with a failure code.

Writing to stderr did not automatically make the process fail. The
failure result came from the exit code.

In wait mode, the worker did not exit by itself. It kept running. The
monitor sent it a signal:

SIGTERM

Because the child was ended by an outside signal, the exit code was
null and the signal was SIGTERM.

The first missing mode run still started a real child process. The
worker rejected the mode and exited with code 1.

The corrected missing mode run never started the worker. The child PID
was undefined, and the parent received an error event. `ENOENT` means
the command was not found.

For success, fail, and wait, both `exit` and `close` fired with the
same code and signal values.

For missing mode, there was an `error` event and a `close` event, but
no `exit` event in the output. This makes sense because no child
process actually started, so there was no normal process exit to
observe.

## What changed?

Before this project, I understood that a child process could exit, but
I did not clearly separate exit codes from signals.

Now I understand that an exit code means the process ended by itself.
A signal means something outside the process told it to end.

I also understand that stdout, stderr, and the final exit result are
separate things the parent can monitor.

I also understand that a startup failure is different from a child
process failing after it has already started.

I now understand that `exit` and `close` are related but not identical.
`exit` is about the process ending. `close` is about the process ending
and its stdio resources closing.

## What did I learn?

- A parent can monitor a child process after starting it.
- stdout is normal output from the child.
- stderr is error output from the child.
- Writing to stderr does not automatically decide the exit code.
- `process.exit(0)` means normal success.
- `process.exit(7)` means the process chose to fail with code 7.
- If a process exits by itself, the parent receives an exit code and
  signal null.
- If a process is terminated by a signal, the parent receives code
  null and the signal name.
- `child.kill("SIGTERM")` sends a termination signal to the child.
- If the command cannot be started, the parent receives an error
  event.
- A missing command can leave `child.pid` as undefined because no child
  process was actually created.
- `ENOENT` means the command or file was not found.
- `exit` means the child process ended.
- `close` means the child process ended and its stdio resources closed.
- If the command cannot start, `error` and `close` can fire without an
  `exit` event.

## What still doesn't make sense?

I have not tested a child that writes a very large amount of output
right before exiting, so I have not seen a case where `exit` and
`close` are far apart in time.

## Mental model after experimenting

A child process has a lifecycle that the parent can observe.

The parent can read the child's stdout and stderr while the child is
running. Then, when the child ends, the parent can inspect the final
reason it ended.

If the child chooses to end, the parent gets an exit code. If the
child is told to end by an outside signal, the parent gets a signal
name. If the child cannot start at all, the parent gets an error
event instead of a normal exit result. `close` is the stronger signal
that the child process and its stdio resources are done.
