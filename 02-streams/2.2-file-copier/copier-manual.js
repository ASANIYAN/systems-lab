const fs = require("fs");

const readStream = fs.createReadStream("big.txt");
const writeStream = fs.createWriteStream("big-copy.txt");

readStream.on("data", (chunk) => {
  const canWrite = writeStream.write(chunk);
  if (!canWrite) {
    readStream.pause();
  }
});

writeStream.on("drain", () => {
  readStream.resume();
});

readStream.on("end", () => {
  writeStream.end();
  console.log("copy finished");
});
