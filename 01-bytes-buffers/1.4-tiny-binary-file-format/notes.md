# Experiment: 1.4 Tiny Binary File Format

## What am I trying to understand?

How to design a small binary file format with a header and a payload.
Also how a reader can trust and correctly parse that format, using
only the raw bytes on disk.

## Mental model before experimenting

I saw the header fields, magic number, version, and length, as
similar to metadata in a request, like HTTP headers. I understood
each field sits before the actual data and describes something about
it.

## What I expected

I expected the magic number to work as a check. If the first bytes of
a file do not match the expected value, the file is not the correct
type, and the reader should refuse to continue instead of guessing.

I expected the version field to protect against future changes to the
format. If I later change the shape of the format, a version number
lets a reader tell old files apart from new ones.

I expected the length field to remove any guessing about where the
data section ends. Without it, a reader has no safe way to know how
many bytes belong to the payload.

## What actually happened

Built writer.js and reader.js. writer.js creates four buffers, magic
number, version, length, and data, and joins them with Buffer.concat.
It writes the result to a real file, data.tiny, using
fs.writeFileSync. reader.js reads that file back with
fs.readFileSync, as a fresh process with no shared memory from
writer.js, and rebuilds each field using fixed byte positions plus the
length value read from the header.

Full round trip confirmed correct:
magic_num: TINY
version: 1
length: 10
data: helloworld

Also added a magic number check in reader.js. If the first 4 bytes do
not decode to "TINY", the reader throws a clear error instead of
continuing.

I later opened data.tiny directly in a text editor while testing.
This is a binary file, not a text file, but the editor treated it as
text. A stray cursor position or edit shifted the file by one byte.
This made the reader output garbage, TIY instead of TINY, a wrong
length value, and shifted data. At first this looked like random,
unstable behavior between two runs of the exact same reader.js, with
no code changes at all. After closing the file in the editor and
rerunning writer.js fresh, the reader became stable again every time.

I also deliberately edited data.tiny again to test the magic number
check on purpose. The check correctly caught the corrupted file and
threw "Not a valid TINY file" instead of producing garbage output.

## Why?

A magic number protects against feeding the wrong file type into a
reader that assumes a specific shape. Without a check, a reader will
blindly treat unrelated bytes as if they were valid header fields.
This does not fail cleanly. It produces wrong, misleading values with
no warning, which is far worse than a clear error.

A version field protects against format changes over time. If the
shape of a format changes later, a version number lets a reader
detect which shape it is looking at, instead of misreading a field
that used to exist or has moved.

A length field removes any need to guess where the data section
stops. The reader reads exactly the declared number of bytes, with no
ambiguity, and no risk of the payload's own contents being mistaken
for a boundary marker.

The one byte shift I saw was not random behavior in my code. It was
real physical corruption of the file, caused by having a binary file
open and editable in a text editor while another process was reading
it as binary data. Text editors assume text. They can shift, insert,
or remove bytes without a clear warning, since they are not aware the
file is meant to hold structured binary data.

## What changed?

I hit two real bugs while building the reader, and both are worth
remembering.

First, I confused two different variables that were both connected to
"length." One held the raw 2 byte buffer for the length field. The
other held the actual decoded number from reading that buffer. I used
the raw buffer where I needed the number, and the data section came
out empty, since adding a number to a buffer does not produce a
useful byte position.

Second, in an earlier draft of writer.js, I calculated the data
length using data.toString("utf8").length, which counts characters,
not bytes. This worked by coincidence for a plain ASCII string like
"helloworld", but it repeats the exact character versus byte gap I
found in project 1.2. The safe fix is data.length directly on the
Buffer, which always reflects true byte count, with no string
conversion involved.

I also changed how I think about binary files and editors. Before
this, I assumed opening any file to glance at it was harmless. Now I
know a binary file should never be opened as editable text while
another process depends on its exact byte layout, since even an
accidental keystroke or cursor action can corrupt it.

## What did I learn?

- Buffer.concat joins an array of buffers into one combined buffer,
  in the exact order given.
- fs.writeFileSync and fs.readFileSync let a writer and a reader
  round trip real binary data through an actual file on disk, not
  just shared memory in one process.
- A magic number check should run first, before trusting any other
  field, since every other field depends on the file actually being
  the correct type.
- Keep raw buffer variables and their decoded number values clearly
  named and separate. Mixing them up causes silent, confusing bugs.
- Always measure a Buffer's size with .length directly on the
  Buffer, never by converting it to a string first.
- Never open a binary file in a plain text editor while another
  process is reading it as binary data. This can silently corrupt
  the file and produce results that look like random, unstable
  behavior, when the real cause is physical file corruption.

## What still doesn't make sense?

I have not tested what happens if the declared length value is larger
than the number of bytes actually remaining in the file. I expect
this to behave like the earlier project 1.1 discovery, where slicing
past the end of a buffer just returns whatever is left with no error,
but I have not confirmed this directly for this format yet.

## Mental model after experimenting

A small binary format is really just an agreed order of fixed size
fields, followed by a payload whose size is declared up front. A
magic number check should always run before trusting any other field.
Byte level bugs are often silent, not crashes, so testing the actual
failure case, not just the success case, is necessary to trust that a
format is safe. Binary files also need to be treated with care outside
of code, since normal editing tools can silently corrupt them the same
way a bug in a reader or writer can.
