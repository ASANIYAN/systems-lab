# Experiment: 4.1 Local Message Passing

## What am I trying to understand?

How two separate local processes can exchange messages.

I want to understand how this is different from using stdout and stdin
as plain streams.

I also want to understand whether sending a JavaScript object across an
IPC channel means sharing the same object in memory, or sending a copy
of the data.

## Mental model before experimenting

From Stage 3, I understood that parent and child processes have
different PIDs and separate memory.

Before starting Stage 4, I thought Redis pub/sub could count as IPC
because separate processes can use it to exchange messages. One or
more processes publish data, and one or more processes subscribe to
receive it.

I also understood that Redis pub/sub uses Redis as an external broker.
The processes are not directly talking to each other.

For this local experiment, I expected the parent and child to remain
separate processes, but to exchange structured messages through an IPC
channel.

## What I expected

When the parent sent:

{ type: "greeting", text: "hello child" }

I expected the child to receive a JavaScript object.

I knew data usually crosses process boundaries as bytes underneath,
but I expected Node to serialize and deserialize the message so the
handler receives an object.

For the mutation test, I expected the child to receive:

{ type: "mutable-test", count: 1 }

The parent sent the message while count was 1, then changed the local
object to count 999 after sending.

I also noted that this depended on whether `child.send()` serialized
the message immediately or kept a reference and serialized later.

## What actually happened

The first output was:

parent pid: 40294
child pid: 40295
child process pid: 40295
child parent pid: 40294
child received: { type: 'greeting', text: 'hello child' }
child received type: object
parent received: { type: 'reply', text: 'hello parent', receivedType: 'greeting' }
parent received type: object
child close code: 0
child close signal: null

This confirmed that the parent and child were separate processes, but
could exchange object shaped messages.

Then I added a mutation test.

The output was:

parent pid: 41012
child pid: 41013
parent mutated message after send: { type: 'mutable-test', count: 999 }
child process pid: 41013
child parent pid: 41012
child received: { type: 'greeting', text: 'hello child' }
child received type: object
child received: { type: 'mutable-test', count: 1 }
child received type: object
parent received: { type: 'reply', text: 'hello parent', receivedType: 'greeting' }
parent received type: object
parent received: { type: 'mutable-test-result', countReceived: 1 }
parent received type: object
child close code: 0
child close signal: null

The child received count 1, not count 999.

## Why?

The parent started the child with an IPC channel:

stdio: ["inherit", "inherit", "inherit", "ipc"]

This gave the parent and child a message channel in addition to normal
process streams.

The parent used `child.send(...)` to send a message to the child.

The child used `process.on("message", ...)` to receive the message.

The child used `process.send(...)` to send a message back to the
parent.

The mutation test showed that IPC message passing did not share the
same JavaScript object in memory.

The parent changed its local object after sending. The child still saw
the original count value. That means the child received a separate
message copy, not a live reference to the parent's object.

## What changed?

Before this project, I understood process separation mostly through
PIDs, stdout, stdin, exit codes, and signals.

Now I understand that separate processes can also exchange structured
messages over an IPC channel.

I also understand that message passing is not the same thing as shared
memory. The receiver gets its own copy of the data.

## What did I learn?

- A parent and child process can exchange messages through a Node IPC
  channel.
- The parent and child still have different PIDs.
- `child.send()` sends a message from the parent to the child.
- `process.on("message", ...)` receives IPC messages.
- `process.send()` sends a message from the child back to the parent.
- Node can deliver object shaped messages to the receiver.
- Sending an object does not mean both processes share the same object
  in memory.
- Mutating the parent's object after sending did not change what the
  child received.

## What still doesn't make sense?

I have not tested what kinds of values can and cannot be sent over the
IPC channel.

I have not tested what happens if the receiver is unavailable when a
message is sent.

I have not yet revisited whether Redis pub/sub should be called IPC or
whether it should be described more specifically as broker based
communication between processes.

## Mental model after experimenting

IPC lets separate processes exchange messages without sharing memory.

The message crosses the process boundary and is reconstructed on the
other side. The receiver can work with the data, but it is not holding
a live reference to the sender's original object.

This means IPC is communication, not shared in process state.
