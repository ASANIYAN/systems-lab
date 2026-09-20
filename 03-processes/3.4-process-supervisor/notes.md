# Experiment: 3.4 Process Supervisor

## What am I trying to understand?

How a parent process can supervise a child process.

I want to understand how a parent can:

- start a worker
- observe whether it succeeds or fails
- restart it after failure
- stop restarting after a maximum number of attempts

## Mental model before experimenting

From 3.1, I understood that a parent can start a child process.

From 3.2, I understood that the parent can observe the child's exit
code and signal.

From 3.3, I understood that the parent may need to watch every process,
not only the final output.

Before this experiment, I expected a supervisor to restart a worker
when the worker exits with a non zero code.

I also expected the supervisor to stop after a maximum number of total
attempts, so it does not restart forever.

## What I expected

I expected this rule:

If the worker exits with code 0, stop.

If the worker exits with a non zero code, restart.

If the worker has already been started 3 times, stop trying.

For:

node supervisor.js 2

I expected:

attempt 1 fails
attempt 2 fails
attempt 3 succeeds
supervisor stops

For:

node supervisor.js 5

I expected:

attempt 1 fails
attempt 2 fails
attempt 3 fails
supervisor gives up

## What actually happened

When I ran:

node supervisor.js 2

The worker failed twice:

starting worker attempt: 1
worker pid: 20752
worker stdout: worker attempt: 1
worker stderr: worker failed on purpose
worker close code: 1
worker close signal: null
worker failed, restarting

starting worker attempt: 2
worker pid: 20753
worker stdout: worker attempt: 2
worker stderr: worker failed on purpose
worker close code: 1
worker close signal: null
worker failed, restarting

Then the third attempt succeeded:

starting worker attempt: 3
worker pid: 20754
worker stdout: worker attempt: 3
worker stdout: worker succeeded
worker close code: 0
worker close signal: null
worker succeeded, supervisor stopping

When I ran:

node supervisor.js 5

The worker failed three times:

starting worker attempt: 1
worker pid: 20756
worker stdout: worker attempt: 1
worker stderr: worker failed on purpose
worker close code: 1
worker close signal: null
worker failed, restarting

starting worker attempt: 2
worker pid: 20757
worker stdout: worker attempt: 2
worker stderr: worker failed on purpose
worker close code: 1
worker close signal: null
worker failed, restarting

starting worker attempt: 3
worker pid: 20759
worker stdout: worker attempt: 3
worker stderr: worker failed on purpose
worker close code: 1
worker close signal: null
max attempts reached, supervisor giving up

## Why?

The supervisor starts the worker as a child process.

The worker receives the attempt number and the number of failures
before success.

If the current attempt is less than or equal to the configured failure
count, the worker exits with code 1.

If the current attempt is greater than the configured failure count,
the worker exits with code 0.

The supervisor watches the worker's close event.

If the close code is 0, the supervisor treats the worker as successful
and stops.

If the close code is non zero, the supervisor checks whether the max
attempt count has been reached.

If the max attempt count has not been reached, the supervisor starts a
new worker process.

If the max attempt count has been reached, the supervisor gives up.

Each restart creates a new process with a new PID. The supervisor does
not repair the old process. It starts a replacement process.

## What changed?

Before this project, I understood how to start and monitor a child
process.

Now I understand the next step: using the child's result to make a
decision.

A supervisor is not only observing. It is deciding whether to restart
or stop.

## What did I learn?

- A supervisor can restart a child process after failure.
- A non zero exit code can be used as the signal to restart.
- Exit code 0 can be used as the signal to stop restarting.
- A max attempt limit prevents infinite restart loops.
- Each restart creates a new process with a new PID.
- Restarting means replacing the failed process, not continuing inside
  the same process.

## What still doesn't make sense?

I have not tested signal based restarts, like restarting a worker after
SIGTERM.

I have not tested adding delay between restarts.

I have not tested what happens if the worker starts successfully and
runs for a long time before failing.

## Mental model after experimenting

A process supervisor is a parent process that owns a restart policy.

It starts a child, observes how the child ends, and decides what to do
next.

If the child succeeds, the supervisor stops. If the child fails and
there are attempts left, the supervisor starts a new child process. If
the child keeps failing, the supervisor eventually gives up.
