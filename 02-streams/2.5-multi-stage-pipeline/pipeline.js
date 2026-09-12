const fs = require("fs");
const { Transform } = require("stream");

const uppercaser = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString("utf8").toUpperCase());
  },
});

let lineNumber = 1;
let leftover = "";

const lineNumberer = new Transform({
  transform(chunk, encoding, callback) {
    const text = leftover + chunk.toString("utf8");
    const lines = text.split("\n");

    leftover = lines.pop();

    const numberedLines = lines.map((line) => {
      const numberedLine = `${lineNumber}: ${line}`;
      lineNumber += 1;
      return numberedLine;
    });

    if (numberedLines.length === 0) {
      callback();
      return;
    }

    callback(null, numberedLines.join("\n") + "\n");
  },

  flush(callback) {
    if (leftover.length > 0) {
      callback(null, `${lineNumber}: ${leftover}\n`);
      return;
    }

    callback();
  },
});

const prefixer = new Transform({
  transform(chunk, encoding, callback) {
    const text = chunk.toString("utf8");
    const prefixed = text
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => `OUT: ${line}`)
      .join("\n");

    if (prefixed.length === 0) {
      callback();
      return;
    }

    callback(null, prefixed + "\n");
  },
});

const readStream = fs.createReadStream("input.txt", {
  highWaterMark: 8,
});

const writeStream = fs.createWriteStream("output.txt");

readStream.on("error", (err) => {
  console.error("read error:", err.message);
});

uppercaser.on("error", (err) => {
  console.error("uppercase error:", err.message);
});

lineNumberer.on("error", (err) => {
  console.error("line number error:", err.message);
});

prefixer.on("error", (err) => {
  console.error("prefix error:", err.message);
});

writeStream.on("error", (err) => {
  console.error("write error:", err.message);
});

writeStream.on("finish", () => {
  console.log("pipeline complete");
});

readStream
  .pipe(uppercaser)
  .pipe(lineNumberer)
  .pipe(prefixer)
  .pipe(writeStream);
