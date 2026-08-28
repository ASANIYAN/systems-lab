const { Writable } = require("stream");
const fs = require("fs");

const slowWriter = new Writable({
  write(chunk, encoding, callback) {
    console.log(`processing chunk of ${chunk.length} bytes...`);
    setTimeout(() => {
      console.log("done processing that chunk");
      callback(); // tells the stream "I'm ready for the next chunk"
    }, 500); // simulate 500ms of slow work per chunk
  },
});

const readStream = fs.createReadStream("big.txt");
readStream.pipe(slowWriter);
