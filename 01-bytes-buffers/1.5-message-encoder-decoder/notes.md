# Experiment: 1.5 Message Encoder Decoder

## What am I trying to understand?

How to design a message format that can hold many different kinds of
messages, one after another, in a single continuous stream of bytes.
Also how a decoder can correctly split that stream back into separate
messages with no gaps or markers between them.

## Mental model before experimenting

I understood the header plus payload idea from project 1.4. I was not
sure yet how a reader could tell many back to back messages apart
inside one stream, since 1.4 only ever dealt with one message per
file.

## What I expected

I expected the type field to tell a reader how to treat the payload,
since the payload's raw bytes carry no built in meaning by
themselves. The same bytes could mean different things depending on
what type says they are.

I expected length to come before type in the byte layout, since a
reader needs to know how many total bytes belong to the current
message before it can safely move on to the next one. This has to
be known first, ahead of even reading type.

I expected 1 byte to be enough for the type field, since a realistic
number of message types, like chat, ping, and error, is far below
256, the max value 1 byte can hold.

## What actually happened

Confirmed all three predictions.

Built encodeMessage(type, payloadStr), which returns a buffer shaped
as [length][type][payload], with length as 2 bytes big endian, type
as 1 byte, and payload as whatever bytes the string encodes to.

Manually predicted the exact byte layout for encodeMessage(1, "hi")
before running it:
00 02 01 68 69

Ran it and confirmed an exact match.

Built three messages and joined them into one stream using
Buffer.concat, with no gaps or markers between them:
msg1 = encodeMessage(1, "hi")
msg2 = encodeMessage(2, "ping")
msg3 = encodeMessage(1, "how are you")

Predicted the total stream length by hand first, field by field, and
got 26 bytes. This matched the real stream.length exactly once run.

Built decodeStream(buffer), a loop that walks through the stream
using an offset variable, reading length, then type, then payload at
each step, then moving offset forward by the total size of that one
message before repeating. Ran it against a real file, stream.bin,
written to disk by the encoder and read back fresh by the decoder.

Correct result, all three messages recovered in order:
{ type: 1, payload: 'hi' }
{ type: 2, payload: 'ping' }
{ type: 1, payload: 'how are you' }
message count: 3

## Why?

A payload's bytes never explain themselves. Type has to exist as a
separate field, decided by whoever wrote the message, so a reader
knows how to treat the payload before looking at its actual content.

Length must come before type in the byte layout, since a stream may
hold many messages placed directly next to each other, with nothing
marking where one ends and the next begins. The reader needs to know
the full size of the current message immediately, so it can safely
skip past it to find the next message's own length field. If type
came first, this would not help, since type alone says nothing about
size.

1 byte is enough for type because a realistic type count is far under
256, the max a single byte can represent. Using more bytes than
needed adds permanent overhead to every message ever sent, for
information that never needed more range in the first place.

## What changed?

I made a real bug in my first version of decodeStream. Every field
read used hardcoded numbers, like buffer.subarray(0, 2), instead of
using the offset variable. This meant every loop iteration read from
the very start of the stream again, always decoding the first
message over and over.

The final line made this worse. I wrote offset = 2 + 1 + length
instead of offset = offset + 2 + 1 + length. This replaces offset
with a fixed number each time, instead of adding to wherever the
reader actually was. Since the decoded length also never changed,
being read from the same fixed position every time, this would have
produced an infinite loop, endlessly decoding the exact same message
and never reaching buffer.length.

The fix was building every field's position from the offset
variable, and using += to move offset forward by the true size of
the message that was just read, 2 plus 1 plus that message's own
length value.

## What did I learn?

- A type field is required whenever a payload could mean more than
  one thing. The payload's bytes never explain themselves on their
  own.
- Field order in a byte format is not arbitrary. Length needs to
  come first whenever a stream may hold many messages back to back,
  since the reader needs to know how far to skip before it can find
  the next message.
- Choosing field size should match the real range of values needed,
  not a round number that feels safe. 1 byte was enough here, and
  using more would add permanent, unnecessary cost to every message.
- A loop that walks through a variable sized stream needs every
  field position built from a moving offset variable, not fixed
  numbers, or every iteration will silently reread the same starting
  position.
- Using = instead of += to update a loop's position variable can
  fully break the loop, sometimes into an infinite loop, since the
  new value replaces the current position instead of building on it.

## What still doesn't make sense?

I have not tested what happens if a message's declared length would
push it past the actual end of the stream, meaning the stream itself
is corrupted or cut off partway through a message. I expect this
needs an explicit check, rather than trusting the loop to handle it
safely on its own.

## Mental model after experimenting

A streaming message format works by making every message
self-describing and self-limiting. Length tells a reader how far to
read, type tells a reader how to treat what it read, and both are
decided by the sender, never guessed by the reader. A decoder for
this kind of stream is really just a loop with a moving position
variable, where every step depends on correctly finishing the step
before it. A bug in how that position variable updates can silently
break the entire loop, without the language raising any error to
point it out.
