# Experiment: 2.2 File Copier

## What am I trying to understand?

How to copy a large file without loading the whole thing into memory
at once, using what I already learned about reading a file in chunks.
Also how a writable stream can push back on a readable stream that is
producing chunks faster than it can handle them.

## Mental model before experimenting

I understood reading a file incrementally from project 2.1. I was not
sure yet how writing would work the same way, or what would happen if
reading happened faster than writing could keep up.

## What I expected

I expected a writable stream to have some kind of signal telling the
sender to slow down once its internal buffer gets full, similar to
how a client and server might signal capacity to each other. I
expected Node's built in pipe method to handle this signal
automatically, without needing to manage it by hand.

## What actually happened

Built two versions of a file copier and confirmed both worked.

Manual version: called writeStream.write(chunk) directly inside the
read stream's data event. Captured the return value of write, which
is true if it is safe to keep sending, or false if the write stream's
buffer is getting full. When false, paused the read stream with
readStream.pause(). Resumed reading only once the write stream fired
a drain event, using readStream.resume(). Called writeStream.end()
once the read stream fired its own end event, so the write stream
knew no more data was coming and could finish writing everything it
still had buffered.

Pipe version: readStream.pipe(writeStream) replaced the entire manual
data, drain, pause, resume, and write.end() logic with a single line.
Listened for finish on the write stream instead of end on the read
stream, since finish specifically confirms the write side has fully
flushed everything to disk, not just that reading has stopped.

Added error listeners on both streams. Verified every copy using
diff, which prints nothing and exits with code 0 only if two files
are truly identical, byte for byte. All versions passed this check.

## Why?

Reading and writing to disk are two separate physical operations that
do not run at the same guaranteed speed. If a program blindly calls
write on every chunk the moment it arrives, without checking whether
the write side can keep up, unwritten chunks pile up in memory
waiting their turn. This defeats the entire point of streaming, since
memory usage would grow the same way it would with reading the whole
file into memory at once.

write()'s return value exists specifically to prevent this. False
means the internal buffer is full, and pausing the source of new
chunks is required until a drain event confirms there is room again.
This coordination is called backpressure. pipe() automates exactly
this coordination internally, which is why it collapses several
manual event handlers into a single line.

Stream errors do not behave like normal synchronous errors. They
fire as their own separate event, not as something a regular
try/catch block can catch. If no error listener is attached to a
stream, Node's default behavior for an unhandled error event is to
crash the entire process. Attaching error listeners on both the read
and write streams turns a crash into a clear, specific, reported
failure instead.

diff is a real verification step, not just confirmation that the
code ran without throwing. A copy operation can technically finish
without an error while still producing a corrupted or incomplete
file. Comparing the actual bytes of both files is the only real proof
the copy is correct.

## What changed?

Before this project, I only knew how to read data incrementally, not
write it incrementally, and I had not yet directly confronted the
idea that two independent operations, like reading from disk and
writing to disk, could run at different speeds and cause a real
problem. I now understand backpressure as something a program has to
either manage manually or rely on pipe to manage automatically. I
also now separate "the code ran with no error" from "the output is
actually correct," and know diff as one concrete way to check the
second claim directly.

## What did I learn?

- fs.createWriteStream(path) is the write side counterpart to
  fs.createReadStream(path).
- writeStream.write(chunk) returns true or false, signaling whether
  it is safe to keep sending more data immediately.
- Ignoring that return value and always writing immediately can let
  memory usage grow unbounded, defeating the purpose of streaming.
- readStream.pause() and readStream.resume(), combined with the
  write stream's drain event, form a manual way to respect
  backpressure.
- writeStream.end() must be called explicitly once no more data is
  coming, so the write stream can flush anything still buffered and
  properly close the file.
- pipe(writeStream) automates this entire coordination in a single
  line.
- finish on a write stream confirms all data has actually been
  flushed to disk. This is a more reliable completion signal than
  end on the read stream, which only confirms reading has stopped.
- Streams need their own error event listeners. An error on a stream
  with no listener crashes the whole process by default, unlike a
  normal try/catch situation.
- diff is a real way to confirm two files are byte for byte
  identical. No output and exit code 0 means the files match
  exactly.

## Mental model after experimenting

Streaming a file copy is not just about reading data in small pieces.
It also requires respecting the pace of whatever is receiving that
data, since reading and writing are two separate operations that do
not run at the same guaranteed speed. Backpressure is the mechanism
that keeps this pace matched, either handled manually through write's
return value and pause and resume, or handled automatically through
pipe. A copy is only truly verified once its actual bytes are
compared, not just once the code finishes running with no error.
