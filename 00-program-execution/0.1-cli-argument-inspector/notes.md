# Experiment: 0.1 CLI Argument Inspector

## What am I trying to understand?

Where command-line arguments come from, what shape Node gives them in,
and whether anything (flags vs. plain values) is treated specially by
the shell or the runtime before my code runs.

## Mental model before experimenting

Assumed `foo`, `bar`, `--verbose` might arrive as functions/variables,
or that `--verbose` would be recognized as a flag automatically by
Node. Also assumed `process.argv` would be empty with no arguments
given.

## What I expected

- Arguments arrive as some kind of list.
- `--verbose` gets treated differently from `foo`/`bar` by the runtime.
- No arguments = empty array.

## What actually happened

`process.argv` is an array of plain strings, always. Every entry —
`foo`, `bar`, `--verbose` — is typed identically. Nothing about the
`--` prefix is special to Node; it's just characters in a string.

Confirmed with:

node inspector.js foo bar --verbose

Output:

```
[
  '/Users/.../bin/node',
  '/Users/.../inspector.js',
  'foo',
  'bar',
  '--verbose'
]
```

Also confirmed `argv` is never empty — index 0 is always the path to
the node binary, index 1 is always the script path. Real arguments
start at index 2. This held even when I launched `node` with nothing
else, and separately when I launched `node --stack-size=2000` (in
that case `--stack-size=2000` went into `execArgv`, not `argv`, since
it's a flag for the Node runtime itself, not for my script).

## Why?

The shell can't know anything about my program's internals, so it
can only hand over the most generic possible thing — flat text. Any
meaning on top of that (flag vs. value vs. number) has to be invented
by code that reads the array — either Node's own parsing (for
`execArgv`) or my own parsing (for `argv`). Node separates its own
runtime flags into `execArgv` before my code ever runs, but everything
after that is untouched raw strings handed to me as-is.

## What changed?

Went from assuming "flags are somehow recognized automatically" to
understanding that flag-detection is 100% something I have to write
myself — there is no built-in concept of a flag at the argv level.

## What did I learn?

- `process.argv` = array of strings, always, no exceptions.
- `argv[0]` = node binary path, `argv[1]` = script path, `argv[2]+`
  = actual arguments.
- `execArgv` is a separate array for flags meant for the Node runtime
  itself, not my script.
- "Type" (flag / number / string) is not a JS-level distinction here —
  every entry is a JS string. Any type system for arguments is
  something I invent in my own parsing code.

## What still doesn't make sense?

- Haven't yet checked: what happens with quoted arguments containing
  spaces (e.g. `node inspector.js "hello world"`) — does that arrive
  as one string or two? Need to test before assuming.
  Ans: Quoting is a shell-level behavior, resolved entirely before Node runs — not something your parsing code needs to handle.
- Haven't checked how `--verbose=true` (flag with an attached value
  via `=`) would need to be parsed differently from `--verbose true`
  (flag and value as two separate argv entries).
  Ans: --flag=value syntax is real and our current parser doesn't decompose it — flagged as a known limitation, not fixed here, since splitting name from value is a distinct concern from detecting "is this a flag" at all.

## Mental model after experimenting

Command-line arguments are just flat text, split by the shell on whitespace, handed to Node with two pieces of overhead prepended (runtime path, script path). Nothing is pre-categorized — every distinction (flag, number, string) is meaning I have to build myself on top of raw strings.
