const { Transform } = require("stream");
const fs = require("fs");

const uppercaser = new Transform({
  transform(chunk, encoding, callback) {
    const transformedChunk = chunk.toString("utf8").toUpperCase();
    callback(null, transformedChunk);
  },
});

const readStream = fs.createReadStream("big.txt");

readStream.on("error", (err) => {
  console.error("read error:", err.message);
});

uppercaser.on("error", (err) => {
  console.error("transform error:", err.message);
});

process.stdout.on("error", (err) => {
  if (err.code === "EPIPE") {
    process.exit(0);
  }
  console.error("stdout error:", err.message);
});

readStream.pipe(uppercaser).pipe(process.stdout);
