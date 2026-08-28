# Experiment: 0.2 Environment Inspector

## What am I trying to understand?

Where environment variables come from, what shape they arrive in,
and whether a running process can be affected by environment changes
made after it has already started.

## Mental model before experimenting

Assumed env vars live somewhere on `process`, probably as an object
since they're looked up by name, not position. Assumed a running
program would not notice external changes to the environment.

## What I expected

- `process.env` is an object, not an array.
- No ordering matters for env vars, unlike argv.
- A running process would not see env changes made after launch,
  whether from its own later logic or from an external shell.

## What actually happened

`process.env` is an object, confirmed. Values are looked up by name
(`process.env.HOME`), matching prediction.

Env vars are a one-time snapshot copied into the process at launch —
not a live connection to the shell. Proved this two ways:

- A process's own code CAN mutate its local copy of `process.env`
  after startup (`process.env.FOO = 'changed-by-my-own-code'` worked
  and was visible on a later read).
- An external shell (a second terminal, or `export` after launch)
  CANNOT reach into an already-running process's environment at all —
  not because of timing, but because process memory is isolated by
  the OS. There is no mechanism for one process to write into
  another's environment after it has started.

## Why?

Environment variables are copied into a process's own memory at
launch, the same way argv is. After that point, `process.env` behaves
like an ordinary in-memory JS object — mutable by your own code, but
with no ongoing link back to the shell that launched it or to any
other process.

## What changed?

Learned that "mutable" and "live-synced with the outside world" are
different properties, and process.env has the first but not the
second — this is going to matter again with streams and TCP later,
where the question of "snapshot vs. continuously flowing" comes up
in a different form.

## What did I learn?

- process.env is a plain object, key-based lookup.
- Env vars are a launch-time snapshot, same category of data as argv.
- A process can mutate its own copy of process.env.
- No external process can mutate another already-running process's
  environment — this is process isolation, which Stage 3 names
  explicitly.

## What still doesn't make sense?

- Haven't tested: does a CHILD process spawned by my running process
  inherit the CURRENT (possibly self-mutated) process.env, or the
  original snapshot from when the parent itself launched? Worth
  revisiting once Stage 3 (Processes) covers process spawning.

## Mental model after experimenting

Environment variables are a one-time, per-process snapshot taken at
launch. They behave like a normal mutable object from inside the
process, but are completely walled off from outside interference —
which is a specific instance of process isolation, a concept that
gets named directly in Stage 3.
