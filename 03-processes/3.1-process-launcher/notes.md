# Experiment: 3.1 Process Launcher

## What am I trying to understand?

How one Node program can start another Node program.

I also want to understand whether the launcher and the child are the
same process or two separate processes.

I want to see how their PIDs relate to each other, and how the child
process sends output back to the parent.

## Mental model before experimenting

At first, I thought the launcher and the child were running inside the
same process.

I thought each one might have separate memory, but I did not yet
understand clearly that each one would also be a separate process with
its own PID.

After reasoning about PIDs, I predicted that the launcher PID and the
child parent PID would match. I also predicted that the spawned child
PID and the child PID would match.

## What I expected

I expected these relationships:

launcher pid === child parent pid

spawned child pid === child pid

I did not make a clear prediction about `child argv`, exit code, or
exit signal before running the script.

After changing `stdio` from `inherit` to `pipe`, I expected the child
output to appear prefixed by the parent.

After adding `"hello"`, `"from"`, and `"parent"` to the spawn
argument list, I expected `process.argv.slice(2)` inside the child to
print those three values.

## What actually happened

The output was:

launcher pid: 8128
spawned child pid: 8129
from child stdout: child pid: 8129
from child stdout: child parent pid: 8128
child argv: []
child exit code: 0
child exit signal: null

The PID relationships matched the prediction.

The launcher PID was 8128.
The child parent PID was also 8128.

The spawned child PID was 8129.
The child PID was also 8129.

The child exit code was 0.
The child exit signal was null.

Then I changed the launcher to pass arguments to the child:

hello
from
parent

The second output was:

launcher pid: 9608
spawned child pid: 9609
from child stdout: child pid: 9609
from child stdout: child parent pid: 9608
from child stdout: child argv: [ 'hello', 'from', 'parent' ]
child exit code: 0
child exit signal: null

This confirmed that the child received the values through
`process.argv.slice(2)`.

## Why?

`spawn()` asks the operating system to start another process.

The child is not a function running inside the launcher. It is a
separate process with its own PID and its own lifecycle.

The launcher is the parent process. The child process stores the
launcher's PID as its parent PID.

`stdio: "pipe"` means the child's stdout is not printed directly to
the terminal. Instead, Node exposes it to the parent as
`child.stdout`.

The parent listens for data from `child.stdout` and writes that data
to its own stdout with a prefix.

The child had three `console.log()` calls, but the parent did not get
three separate prefixed lines. This shows the same stream rule from
Stage 2: one write or log call does not always equal one data chunk.

Command line arguments are one way for the parent to pass data into
the child when the child starts. The child does not automatically get
the parent's local variables.

## What changed?

Before this project, I still had a loose idea that launching a child
program might be like calling another function.

Now I understand that launching a child program creates a separate
process. It has a different PID, separate memory, its own stdout, and
its own exit result.

I also understand that a child process's stdout can become a stream in
the parent process.

I also understand that data must cross the process boundary
explicitly. In this project, the parent passed data through command
line arguments.

## What did I learn?

- `spawn()` starts a separate child process.
- The parent process and child process have different PIDs.
- The child's parent PID matches the launcher's PID.
- The `child` object in the parent represents the child OS process.
- `stdio: "inherit"` lets the child write directly to the same
  terminal.
- `stdio: "pipe"` gives the parent access to the child's stdout as
  `child.stdout`.
- The parent can pass startup data to the child through command line
  arguments.
- The child can read those values with `process.argv.slice(2)`.
- A child process can exit normally with exit code 0 and signal null.
- Process stdout follows stream chunk rules. One `console.log()` call
  does not guarantee one `data` event.

## What still doesn't make sense?

I have not tested what happens when the child process fails.

I do not yet know the difference between the child process `exit`
event and other process events like `close`.

## Mental model after experimenting

A function call runs inside the current process.

A spawned program runs as a separate process managed by the operating
system.

The parent and child are connected, but they are not the same running
program. The parent can observe the child, receive its stdout as a
stream, pass startup arguments to it, and read its exit result.
