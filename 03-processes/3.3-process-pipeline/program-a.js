const mode = process.argv[2] || "normal";

if (mode !== "slow") {
  process.stdout.write("hello\n");
  process.stdout.write("world\n");
  return;
}

let line = 0;
const totalLines = 200000;

function writeMore() {
  while (line < totalLines) {
    line += 1;
    const canKeepWriting = process.stdout.write(`line ${line}\n`);

    if (!canKeepWriting) {
      process.stderr.write(`program A backpressure at line ${line}\n`);
      process.stdout.once("drain", () => {
        process.stderr.write(`program A drain at line ${line}\n`);
        writeMore();
      });
      return;
    }
  }

  process.stderr.write(`program A finished writing ${totalLines} lines\n`);
}

writeMore();
