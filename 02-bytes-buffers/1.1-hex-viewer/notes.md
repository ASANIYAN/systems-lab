# Experiment: 1.1 Hex Viewer

## What am I trying to understand?

How data is stored in a file, underneath text and UI layers. Also how
to build a tool that shows raw bytes in a way a human can read,
without losing or changing any of the real data.

## Mental model before experimenting

I assumed reading and writing files worked close to how a human reads
text. I thought files were mostly handled as strings.

## What I expected

I predicted that fs.readFileSync() with no encoding argument would
return a raw Buffer, not a string. I based this on what happened in
project 0.3, where stdin needed an explicit .toString() call to become
text. Node seems to default to raw bytes and requires you to ask for
text on purpose.

## What actually happened

Confirmed. fs.readFileSync(path) with no second argument always
returns a Buffer. A byte is just a number from 0 to 255. Nothing more.
Hex, decimal, and a printable character are three different ways to
show that same number on screen. None of them is a step the number
passes through to become another. Hex is used for display because one
hex digit equals exactly 4 bits. This means one byte always maps to
exactly 2 hex characters. Decimal does not have this clean match.

## Why?

A file is just a list of numbers. It has no built in meaning. Meaning
is added later, by whatever program reads the file and decides how to
treat those numbers. This is the same idea from 0.1, where flag,
number, and string were categories I invented in code. They were never
part of the raw argv strings themselves.

## What changed?

Before this project, I thought hex was some kind of middle step
between text and binary. Now I understand hex is only a display
format. A byte's real identity is its number. Hex, decimal, and
character form are just different ways to print that same number for
humans.

## What did I learn?

- fs.readFileSync() always returns a Buffer by default. No exceptions.
- A byte only has one true form: a number from 0 to 255. Hex, decimal,
  and character form are display choices, not separate stages of
  conversion.
- String.fromCharCode(n) turns a number into a character.
  "x".charCodeAt(0) turns a character into a number. Neither of these
  passes through hex at any point.
- Buffer .slice() and .subarray() both share memory with the original
  buffer. This is different from Array.slice(), which makes a copy.
  Writing into a sliced or subarrayed buffer changes the original
  buffer too. I confirmed this directly: changing a value in a
  subarray changed the original buffer.
- I hit four real bugs while building this, and each one taught me
  something specific:
  1. I logged the offset value after incrementing start instead of
     before. This made every row show the wrong starting position.
     Fix: log the offset first, then increment.
  2. I wrote a condition using && where I needed ||. My condition
     checked if a byte was less than 32 AND greater than 126. No
     number can ever satisfy both at once, so the condition could
     never be true. I needed OR, since a byte only needs to fail one
     side of the range to count as not printable.
  3. I tried to store the string "." directly into a Buffer index.
     Buffers only store numbers. JavaScript did not throw an error. It
     silently tried to coerce the string into a number, which failed,
     and stored something unintended instead. The fix was to use
     ".".charCodeAt(0) to get the real numeric value for a dot
     character.
  4. I mutated the row buffer directly while building the ASCII
     column. Since row came from data.subarray(), it shared memory
     with the original file data. My changes were leaking into both
     the hex column, which should always show true unedited bytes,
     and the real file data buffer itself. Fix: never write into row.
     Build a completely separate string for the ASCII column instead.

## What still doesn't make sense?

I have not tested this on a large file, so I do not know how it
behaves with memory or speed at scale. I also have not tested it on a
real binary file like an image, only on plain text source files so
far.

## Mental model after experimenting

A byte is only ever a number. Hex, decimal, and character form are
just different labels placed on that same number for human reading.
Buffers default to raw, unlabeled data. Any structure or meaning, like
flags, printable text, or row layout, has to be added by code on
purpose. Buffer slicing methods share memory with their source, so any
code that writes into a sliced buffer needs to be treated as changing
the original data too, not a safe separate copy.
