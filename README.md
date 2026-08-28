# Systems Lab

This is a learning lab for Node.js systems concepts. Each folder is a small
hands-on experiment. Every experiment has a `notes.md` file with what was
expected and what actually happened.

## Structure

### 01-program-execution
How a program starts and runs.

- 0.1 CLI argument inspector — how command-line arguments arrive in Node.
- 0.2 Environment inspector — how environment variables are read.
- 0.3 Stdin/stdout pipeline — how a producer and consumer talk over pipes.
- 0.4 Event experiment — how the event loop schedules callbacks.
- 0.5 Async ordering — the order sync code, promises, and timers run in.

### 02-bytes-buffers
How raw bytes and buffers work.

- 1.1 Hex viewer — reading a file and printing it as hex.
- 1.2 String encoder/decoder — converting strings to bytes and back.
- 1.3 Binary integer encoder — packing and unpacking integers as bytes.
- 1.4 Tiny binary file format — reading and writing a custom binary format.
- 1.5 Message encoder/decoder — encoding and decoding structured messages.

### 03-streams
How Node streams move data.

- 2.1 File chunk reader — reading a file in chunks.
- 2.2 File copier — copying a file manually and with `pipe`.
- 2.3 Slow consumer — observing backpressure with a slow writable stream.

## Running an experiment

Each experiment is a plain Node.js script. From inside a folder, run it with:

```
node <script-name>.js
```

Check the `notes.md` file in each folder for details on what the
experiment tests and what was found.
