# Experiment: 4.2 IPC Request Response

## What am I trying to understand?

How to build request and response behavior over IPC messages.

I want to understand how a parent process can send a request to a
child process, then match the response back to the original request.

I also want to understand why request IDs matter when more than one
request is active at the same time.

## Mental model before experimenting

From 4.1, I understood that a parent and child process can exchange
object shaped messages over an IPC channel.

Before this project, I expected request and response IPC to need an
identifier. Each message needs to be easy to identify, and an ID makes
it possible to match a response to the request that caused it.

I also expected the parent not to assume responses would arrive in the
same order as requests. This is typical in sender and receiver systems,
because messages or results can arrive out of order.

## What I expected

If the parent sent:

{ id: 1, type: "uppercase", text: "hello" }

I expected the child to return:

{ id: 1, type: "uppercase-result", text: "HELLO" }

The response should keep the same ID so the parent can match it to the
original request.

If the parent sent two requests quickly:

{ id: 1, type: "uppercase", text: "hello" }
{ id: 2, type: "uppercase", text: "world" }

I expected the parent to match responses by ID, not by order.

I expected request 2 to be able to return before request 1.

## What actually happened

The output was:

parent sent: { id: 1, type: 'uppercase', text: 'hello' }
parent sent: { id: 2, type: 'uppercase', text: 'world' }
child received: { id: 1, type: 'uppercase', text: 'hello' }
child received: { id: 2, type: 'uppercase', text: 'world' }
parent received: { id: 2, type: 'uppercase-result', text: 'WORLD' }
matched original request: { id: 2, type: 'uppercase', text: 'world' }
parent received: { id: 1, type: 'uppercase-result', text: 'HELLO' }
matched original request: { id: 1, type: 'uppercase', text: 'hello' }

The child received the requests in order.

The parent received the responses out of order.

The parent still matched each response to the correct original request
using the ID.

## Why?

The parent stored each request in a `Map` before sending it.

The request ID was the key:

pending.set(request.id, request)

When a response arrived, the parent looked up the original request:

pending.get(response.id)

The child intentionally delayed request 1 longer than request 2.

That made response 2 arrive first.

Because the parent matched by ID, the order did not matter.

## What changed?

Before this project, I understood basic message passing between
processes.

Now I understand that request and response messaging needs correlation.
A response is only useful if the parent knows which request it belongs
to.

I also understand that response order is not a safe way to match work
in a concurrent or asynchronous system.

## What did I learn?

- IPC request and response can be built on top of basic IPC messages.
- A request ID connects a response back to the original request.
- A parent can keep pending requests in a `Map`.
- Responses can arrive out of order.
- Matching by order is fragile.
- Matching by ID is safer.
- The same pattern appears in request IDs, job IDs, RPC IDs, and
  correlation IDs.

## What still doesn't make sense?

I have not tested timeouts for requests that never get a response.

I have not tested how the parent should handle an error response from
the child.

I have not tested duplicate response IDs or missing response IDs.

## Mental model after experimenting

Request and response IPC is not just sending messages in both
directions.

It needs a way to connect each response to the request that caused it.

The request ID is the link. Without that link, the parent would have to
guess based on order, and order is not a safe guarantee.
