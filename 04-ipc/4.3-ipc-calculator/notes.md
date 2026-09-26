# Experiment: 4.3 IPC Calculator

## What am I trying to understand?

How one process can expose computation to another process over IPC.

I want to understand how a child process can act like a small service:
it receives requests, performs work, and sends results back.

I also want to understand how invalid requests should be handled
without crashing the whole child process.

## Mental model before experimenting

From 4.1, I understood that parent and child processes can exchange
object shaped messages.

From 4.2, I understood that request and response messages need IDs so
the parent can match each response to the correct request.

Before this project, I expected the calculator child to process valid
requests and return results. I also expected invalid operations to
return error responses instead of crashing the calculator process.

## What I expected

For this request:

{ id: 1, type: "calculate", operation: "add", left: 2, right: 3 }

I expected:

{ id: 1, type: "calculate-result", result: 5 }

For this request:

{ id: 2, type: "calculate", operation: "multiply", left: 4, right: 5 }

I expected:

{ id: 2, type: "calculate-result", result: 20 }

For an unknown operation like divide, I expected an error response.

I expected only that one request to fail. I did not expect the whole
calculator process to fail.

## What actually happened

The first run produced:

parent sent: { id: 1, type: 'calculate', operation: 'add', left: 2, right: 3 }
parent sent: { id: 2, type: 'calculate', operation: 'multiply', left: 4, right: 5 }
parent sent: { id: 3, type: 'calculate', operation: 'divide', left: 10, right: 2 }
calculator received: { id: 1, type: 'calculate', operation: 'add', left: 2, right: 3 }
calculator received: { id: 2, type: 'calculate', operation: 'multiply', left: 4, right: 5 }
calculator received: { id: 3, type: 'calculate', operation: 'divide', left: 10, right: 2 }
parent received: { id: 1, type: 'calculate-result', result: 5 }
matched request: { id: 1, type: 'calculate', operation: 'add', left: 2, right: 3 }
parent received: { id: 2, type: 'calculate-result', result: 20 }
matched request: { id: 2, type: 'calculate', operation: 'multiply', left: 4, right: 5 }
parent received: { id: 3, type: 'error', error: 'unknown operation: divide' }
matched request: { id: 3, type: 'calculate', operation: 'divide', left: 10, right: 2 }

The valid requests returned results.

The invalid divide request returned an error response.

The calculator did not crash, but it also did not print a close event
at first. This showed that completing all requests was not the same as
shutting down the child process cleanly.

I first tried to handle `disconnect`, but the parent still did not
print the child close event.

Then I changed the protocol so the parent sends an explicit shutdown
message after all responses arrive.

The final run ended with:

calculator received: { type: 'shutdown' }
calculator close code: 0
calculator close signal: null

## Why?

The parent sent calculator requests with IDs.

The child checked the request type and operation.

For valid operations, the child sent a result response with the same
ID.

For the invalid operation, the child caught the error and sent an error
response with the same ID.

This meant the bad request failed by itself. The calculator process
stayed alive and continued following the protocol.

The cleanup problem happened because request completion and process
shutdown are different things.

The parent receiving all responses meant all work was done, but the
child process still needed a clear reason to exit.

The explicit shutdown message made shutdown part of the IPC protocol.

## What changed?

Before this project, I understood request and response matching.

Now I understand that a child process can expose a small service API
over IPC.

I also understand that request failure and process failure are not the
same thing.

I now understand that a worker process also needs a shutdown path. It
is not enough to finish all current requests if nothing tells the child
to exit.

## What did I learn?

- A child process can expose computation to a parent process over IPC.
- Each request should include an ID.
- Each response should include the same ID.
- Valid requests can return result responses.
- Invalid requests can return error responses.
- A bad request does not have to crash the worker process.
- Request completion is different from process shutdown.
- A shutdown message can make cleanup explicit.

## What still doesn't make sense?

I have not tested a request that takes a long time to complete.

I have not tested request timeouts.

I have not tested what happens if the calculator process crashes while
requests are still pending.

## Mental model after experimenting

An IPC worker can behave like a small local service.

The parent sends requests. The child validates them, performs work, and
sends back either a result or an error.

Errors can belong to a single request instead of the whole process.

The process lifecycle still needs its own protocol. Finishing work does
not automatically mean the worker has shut down cleanly.
