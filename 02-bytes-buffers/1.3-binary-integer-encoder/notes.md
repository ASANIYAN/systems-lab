# Experiment: 1.3 Binary Integer Encoder

## What am I trying to understand?

How to store a number using a fixed number of bytes. Also how byte
order changes the way a number is stored and read back.

## Mental model before experimenting

I assumed a fixed number of bytes would set some kind of limit on the
size of a number, but I did not know the exact limit or why it exists.
I also assumed byte order might not matter, since both halves of a
number are stored either way.

## What I expected

I expected that using exactly 2 bytes would set a maximum value based
on how many bit patterns 2 bytes can hold. I did not know the exact
number before calculating it.

I expected byte order to matter, once I worked through an example by
hand. A reader must use the same order the writer used, or the result
will be wrong.

## What actually happened

Confirmed. 2 bytes equal 16 bits. Each bit can be 0 or 1, so 16 bits
can form 2 to the power of 16 different patterns. This equals 65536.
Since counting starts at 0, the valid range is 0 to 65535. A 17th bit
would be needed to store anything past that, and a fixed 2 byte budget
does not have one.

I tested writing 300 two different ways:

- writeUInt16BE gave bytes 01 2c
- writeUInt16LE gave bytes 2c 01

Both store the same number, 300, but in reverse byte order.

I then tested reading these bytes back using the correct and the
wrong convention:

- bufBE.readUInt16BE() -> 300 (correct)
- bufLE.readUInt16LE() -> 300 (correct)
- bufBE.readUInt16LE() -> 11265 (wrong convention used)
- bufLE.readUInt16BE() -> 11265 (wrong convention used)

No error was thrown in the wrong cases. The result was just silently
incorrect.

## Why?

A byte only holds values from 0 to 255. Numbers larger than this need
more than one byte, split into parts. One part is the big part, worth
256 times more than the other. The other part is the small part.

There are two accepted orders for storing these two parts:

- Big endian: the big part comes first, then the small part.
- Little endian: the small part comes first, then the big part.

Both orders store the same number correctly, as long as the reader
knows which order was used. If the reader assumes the wrong order, it
will treat the small part as the big part and the big part as the
small part. This produces a different, wrong number, using the exact
same bytes.

Manual proof, using bytes 01 and 2c (decimal 1 and 44):

- Correct order: (1 x 256) + 44 = 300
- Wrong order: (44 x 256) + 1 = 11265

This confirms why byte order must be agreed upon between whoever
writes the data and whoever reads it. This is also why network
protocols like TCP and IP standardize on big endian, often called
network byte order, so machines do not need to guess.

## What changed?

Before this project, I mixed up bits and bytes at one point during
testing. I now hold the difference firmly: 1 byte equals 8 bits. 300
in binary uses 16 bits, which equals 2 bytes, not 16 bytes.

I also moved from assuming byte order might not matter to proving,
with real numbers, that it changes the result completely, with no
error or warning at all.

## What did I learn?

- A fixed number of bytes sets a fixed maximum value. For 2 bytes,
  the range is 0 to 65535, since 2 to the power of 16 equals 65536
  total values, counting from 0.
- Big endian stores the big part of a number first. Little endian
  stores the small part first.
- Buffer has writeUInt16BE, writeUInt16LE, readUInt16BE, and
  readUInt16LE for handling this directly.
- Reading a value with the wrong byte order does not throw an error.
  It silently returns a different, incorrect number.
- 1 byte equals 8 bits. 3 bytes equal 24 bits.

## What still doesn't make sense?

I have not tested numbers that need more than 2 bytes, such as a 4
byte or 8 byte integer. I also have not looked at how negative
numbers would be represented, since everything tested here was a
positive number.

## Mental model after experimenting

A fixed byte budget always sets a fixed maximum value, with no
exceptions. Any number that needs more than one byte must be split
into parts, and those parts can be arranged in more than one valid
order. Byte order is not a small detail. It must be agreed upon by
both the writer and the reader, since a silent mismatch produces a
completely wrong number with no warning at all.
