# Experiment: 1.2 String Encoder Decoder

## What am I trying to understand?

How a string turns into numbers and back again. Also whether one
character always equals one byte, or if that idea breaks down for
some characters.

## Mental model before experimenting

I assumed most characters fit inside a single byte, since every
character I tested in 1.1 lined up as one byte each. I was not sure
if every character in existence could fit in one byte.

## What I expected

I expected "café".length and Buffer.from("café").length to be
different numbers. I expected the byte count to be bigger than the
character count, since é is not a plain ASCII character.

## What actually happened

Confirmed. "café".length is 4. Buffer.from("café").length is 5.

I built my own encode and decode functions using charCodeAt and
fromCharCode. They round trip correctly, even for café. But when I
compared my own encode("café") to Buffer.from("café"), the two did
not match in length:

encode("café") -> [ 99, 97, 102, 233 ] (4 numbers)
Buffer.from("café") -> <Buffer 63 61 66 c3 a9> (5 bytes)

c, a, and f match cleanly in both. é does not. My function gives one
number, 233. Buffer.from gives two bytes, c3 and a9.

## Why?

charCodeAt does not work on bytes. It works on a character's Unicode
code point. A code point is one number that identifies which
character it is. This number has nothing to do with how many bytes
are needed to store that character on disk or send it over a
network.

Plain ASCII characters have code points under 128. These always fit
in one byte, so code point and byte look the same for them. This is
why 1.1 never showed this problem. Every character in that test file
was plain ASCII.

é has a code point of 233. UTF-8 cannot store this number in a single
byte, since UTF-8 reserves values above 127 to signal "this byte is
part of a longer sequence, keep reading." So UTF-8 splits 233 across
two bytes using its own encoding rule. This is real bit level work
that Buffer.from does automatically. My own encode and decode
functions do not do this work. They only move directly between a
character and its code point number, with no byte splitting at all.

## What changed?

Before this project, I treated "character" and "byte" as the same
thing. Now I understand they are only the same for plain ASCII. Past
that, one character can need two, three, or four bytes, and the
number stored is not the same as the code point number at all.

## What did I learn?

- A string spread with ...str turns into an array of characters,
  which can then be used with .map().
- charCodeAt(0) returns a Unicode code point, not a byte value.
- String.fromCharCode(n) does the reverse, turning one code point
  back into one character.
- My encode/decode round trip works correctly, but it operates on
  code points, not on real UTF-8 bytes.
-
