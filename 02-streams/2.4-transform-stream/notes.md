# Experiment: 2.4 Transform Stream

## What am I trying to understand?

How a stream can both read and transform data at the same time,
without collecting the whole file into memory first. Also whether a
transform can safely be applied to each chunk on its own, or if some
transforms need to remember something across chunk boundaries.

## Mental model before experimenting

I understood Readable streams from 2.1 and Writable streams from 2.2
and 2.3. I was not sure yet what a Transform stream actually needed
to do differently, beyond being both at once.

## What I expected

I expected a plain ASCII uppercase transform to work correctly on
each chunk independently, since every ASCII character is exactly 1
byte. A chunk boundary can only ever fall between two full
characters, never inside one, so no cross-chunk memory should be
needed for this specific transform.

I expected \_transform's callback to need to communicate more than
\_write's callback did. \_write's callback only says "I am ready for
more." \_transform also has to hand back the actual transformed
output, since a Transform stream still needs to produce data on its
readable side for whatever is piped after it.

## What actually happened

Confirmed the callback difference. \_transform(chunk, encoding,
callback) uses callback(null, transformedChunk), not just
callback(). The second argument is the new, changed data that gets
pushed downstream. This is the concrete difference from \_write,
whose callback only signals readiness for more input.

Wrote a working uppercase transform:

const uppercaser = new Transform({
transform(chunk, encoding, callback) {
const transformedChunk = chunk.toString("utf8").toUpperCase();
callback(null, transformedChunk);
},
});

Tested it against big.txt, a file containing only the letter x
repeated many times. The output was fully uppercase X throughout,
confirming the transform ran correctly end to end.

## Why?

\_write only ever consumes input, so its callback has one job: saying
"send the next chunk." \_transform both consumes and produces, so its
callback has two jobs: saying "send the next chunk" and handing over
the actual transformed result to be pushed downstream.

My ASCII boundary reasoning is that no ASCII character is ever more
than 1 byte wide, so a chunk boundary cut can never land inside a
character, only between two of them. This means
toString("utf8").toUpperCase() should be safe to run on each chunk in
isolation, with zero memory of a previous chunk, for plain ASCII
input. This is reasoning, not something my own test actually proved,
since a file of all x characters looks identical whether or not
chunk boundary handling is correct. A file with known, varied content
at every position would be needed to actually confirm this at a real
boundary.

## What changed?

Before this project, I only knew Readable and Writable streams. I now
understand a Transform stream as both at once, where the callback has
to carry the transformed output forward, not just signal readiness
for the next chunk.

## What did I learn?

- \_transform(chunk, encoding, callback) requires callback(error,
  transformedData), unlike \_write's callback(error), since a
  Transform stream must both consume and produce data.
- A file of uniform, repeated content, like all x characters, cannot
  reveal chunk boundary bugs, since every byte looks identical
  whether the logic handling boundaries is correct or not.

## What still doesn't make sense?

I have not actually tested this transform with content where each
position is known and varied, so I have not directly confirmed
whether a chunk boundary is handled correctly. My big.txt test could
not have revealed a boundary bug even if one existed, since every
character in that file is identical.

I have also not tested this transform against multi-byte UTF-8
content, like a file containing é or an emoji. Based on the reasoning
from 1.2, I expect this transform would actually break in that case,
since toString("utf8") is being called independently on each raw
chunk, with no memory of a dangling partial character left over from
the chunk before it. This would need a leftover-buffer approach,
holding back a trailing partial character and prepending it to the
next chunk, to fix correctly.

## Mental model after experimenting

A Transform stream is a Writable and a Readable joined together,
where the callback both signals readiness for more input and
delivers the actual transformed output. Whether a transform can
safely operate on isolated chunks depends entirely on whether a
single logical unit, like one character, could ever be physically
split across a chunk boundary. My reasoning says plain ASCII text
never has this problem, but I have not directly proven this with a
real test yet, only with content that could not have revealed the
problem either way.
