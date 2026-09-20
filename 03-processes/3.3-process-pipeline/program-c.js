const mode = process.argv[2] || "normal";
let leftover = "";
let lineCount = 0;

process.stdin.on("data", (chunk) => {
  const text = leftover + chunk.toString("utf8");
  const lines = text.split("\n");

  leftover = lines.pop();

  for (const line of lines) {
    if (line.length > 0) {
      if (mode === "slow") {
        lineCount += 1;
        continue;
      }

      process.stdout.write(`OUT: ${line}\n`);
    }
  }
});

process.stdin.on("end", () => {
  if (leftover.length > 0) {
    if (mode === "slow") {
      lineCount += 1;
      process.stdout.write(`program C received ${lineCount} lines\n`);
      return;
    }

    process.stdout.write(`OUT: ${leftover}\n`);
    return;
  }

  if (mode === "slow") {
    process.stdout.write(`program C received ${lineCount} lines\n`);
  }
});
