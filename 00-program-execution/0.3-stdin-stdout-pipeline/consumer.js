process.stdin.on("data", (chunk) => {
  console.log(chunk.toString()); // adds new line
  process.stdout.write(chunk.toString());
});
