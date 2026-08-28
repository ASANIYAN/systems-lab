# Experiment: 2.1 File Chunk Reader

## What am I trying to understand?

How to read a large file without loading the whole thing into memory
at once. Also whether file reading follows the same event based
pattern I already used with stdin in project 0.3.

## Mental model before experimenting

I understood that reading everything at once has some kind of cost
for very large files, but I was not fully sure what that cost really
was. I guessed file streaming would use an event based pattern,
similar to stdin, but I was not certain.

## What I expected

I expected fs.createReadStream to deliver a file's data in multiple
smaller pieces over time, using a data event, the same shape as
process.stdin from 0.3. I expected most chunks to be the same fixed
size, with the final chunk being smaller, holding whatever was left
over. I guessed the file would arrive in around 10 to 20 chunks.

## What actually happened

Confirmed the event based pattern. fs.createReadStream(path) returns
a stream object. Attaching .on("data", chunk => ...) fires once per
chunk, and .on("end", ...) fires once the whole file has been fully
read.

Tested with a 300,000 byte file. Actual result was 5 chunks total,
not 10 to 20 as guessed:
chunk 1: 65536 bytes
chunk 2: 65536 bytes
chunk 3: 65536 bytes
chunk 4: 65536 bytes
chunk 5: 37856 bytes
total chunks: 5

Confirmed by hand that 4 times 65536 plus 37856 equals exactly
300000, the true file size, with nothing missing and nothing extra.

65536 is exactly 2 to the power of 16, the same ceiling number from
project 1.3. This is Node's default chunk size for file streams,
called the highWaterMark, set to 64KB by default.

## Why?

Loading an entire large file into memory before doing anything with
it has a real cost, not just a theoretical one. A 10GB file needs
roughly 10GB of memory just to hold it, before any real processing
starts. If memory is limited or the file is even larger, this can
crash the program outright. It also means the program produces
nothing and does no useful work until the entire file has finished
loading, even if only a small part of it was actually needed.

Streaming avoids both problems. Only one chunk needs to sit in memory
at any single moment, and the program can begin real work on the
first chunk while later chunks are still being read from disk. This
is the same underlying idea as stdin from 0.3, just applied to a file
on disk instead of a live input source.

The chunk size itself is not something the file's content decides.
It is a setting Node picks by default, 64KB, the same way a hex
viewer row size was a design choice I made myself in project 1.1,
not something inherent to the data.

## What changed?

Before this project, I treated "read a file" as always meaning "get
the whole thing back in one piece," since that is what
fs.readFileSync did in every earlier project. Now I understand that
was only ever a fair approach for small files. For large files, the
same "read everything into memory instantly" approach becomes a real
risk, not just a slower path.

I also went from an approximate guess about chunk count to an exact,
confirmed number, and traced that number back to a concept I already
understood from 1.3, 2 to the power of 16, now appearing as Node's
actual default chunk size rather than just a byte ceiling number.

## What did I learn?

- fs.createReadStream(path) reads a file incrementally, firing a
  data event once per chunk, and an end event once the file is fully
  read.
- This is the same event based pattern as process.stdin from 0.3,
  just connected to a file source instead of standard input.
- Node's default chunk size for file streams is 65536 bytes, 64KB,
  known as the highWaterMark. This is configurable but defaults to
  this value.
- Every chunk before the last one will be exactly this default size.
  The final chunk holds whatever bytes are left over, and is
  normally smaller.
- Streaming avoids holding an entire large file in memory at once,
  and lets a program begin real work on early chunks before the rest
  of the file has even finished loading.

## What still doesn't make sense?

I have not tested what happens with a file smaller than 65536 bytes,
which I expect would arrive in exactly one chunk, matching the
project 0.3 note about a single small write producing a single data
event. I also have not tested whether the highWaterMark value can
actually be changed, only observed its default.

## Mental model after experimenting

Reading a large file does not need to mean loading it all into
memory at once. A stream breaks a file into fixed size chunks, using
a default chunk size of 64KB, and delivers them one at a time through
the same event based pattern already used for stdin. Chunk size is a
setting, not something inherent to the file's actual content, and
choosing that size is a real design decision, the same as choosing a
row width was in project 1.1's hex viewer.
