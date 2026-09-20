const mode = process.argv[2] || "normal";

if (mode === "fail") {
  console.error("program B failed before writing output");
  process.exit(7);
}

if (mode === "slow") {
  let chunkCount = 0;
  let ended = false;
  let processing = false;
  const queue = [];

  function processNext() {
    if (processing) {
      return;
    }

    const chunk = queue.shift();
    if (!chunk) {
      if (ended) {
        process.stdout.end();
      }
      return;
    }

    processing = true;
    chunkCount += 1;

    setTimeout(() => {
      process.stdout.write(chunk.toString("utf8").toUpperCase());
      process.stderr.write(`program B forwarded chunk ${chunkCount}\n`);
      processing = false;
      process.stdin.resume();
      processNext();
    }, 25);
  }

  process.stdin.on("data", (chunk) => {
    process.stdin.pause();
    queue.push(chunk);
    processNext();
  });

  process.stdin.on("end", () => {
    ended = true;
    processNext();
  });

  return;
}

process.stdin.on("data", (chunk) => {
  process.stdout.write(chunk.toString("utf8").toUpperCase());
});

process.stdin.on("end", () => {
  process.stdout.end();
});
