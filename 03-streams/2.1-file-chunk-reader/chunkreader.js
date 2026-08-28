const fs = require("fs");

const stream = fs.createReadStream("big.txt");
let chunkCount = 0;

stream.on("data", (chunk) => {
  chunkCount++;
  console.log(`chunk ${chunkCount}: ${chunk.length} bytes`);
});

stream.on("end", () => {
  console.log("total chunks:", chunkCount);
});
