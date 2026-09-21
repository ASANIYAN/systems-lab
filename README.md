# Systems Lab

This is a learning lab for Node.js systems concepts. Each folder is a small
hands-on experiment. Every experiment has a `notes.md` file with what was
expected and what actually happened.

## Structure

### 00-program-execution
How a program starts and runs.

- 0.1 CLI argument inspector — how command-line arguments arrive in Node.
- 0.2 Environment inspector — how environment variables are read.
- 0.3 Stdin/stdout pipeline — how a producer and consumer talk over pipes.
- 0.4 Event experiment — how the event loop schedules callbacks.
- 0.5 Async ordering — the order sync code, promises, and timers run in.

### 01-bytes-buffers
How raw bytes and buffers work.

- 1.1 Hex viewer — reading a file and printing it as hex.
- 1.2 String encoder/decoder — converting strings to bytes and back.
- 1.3 Binary integer encoder — packing and unpacking integers as bytes.
- 1.4 Tiny binary file format — reading and writing a custom binary format.
- 1.5 Message encoder/decoder — encoding and decoding structured messages.

### 02-streams
How Node streams move data.

- 2.1 File chunk reader — reading a file in chunks.
- 2.2 File copier — copying a file manually and with `pipe`.
- 2.3 Slow consumer — observing backpressure with a slow writable stream.
- 2.4 Transform stream — transforming data as it moves through a stream.
- 2.5 Multi-stage pipeline — composing multiple transforms into one pipeline.

### 03-processes
How programs run as separate OS-managed processes.

- 3.1 Process launcher — starting a child process and observing PIDs.
- 3.2 Process monitor — tracking stdout, stderr, exit codes, signals, and startup failure.
- 3.3 Process pipeline — connecting separate processes with stdin and stdout.
- 3.4 Process supervisor — restarting failed child processes with a max attempt limit.

## Running an experiment

Each experiment is a plain Node.js script. From inside a folder, run it with:

```
node <script-name>.js
```

Check the `notes.md` file in each folder for details on what the
experiment tests and what was found.
