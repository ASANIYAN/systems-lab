const fs = require("fs");

const readStream = fs.createReadStream("big.txt");
const writeStream = fs.createWriteStream("big-copy.txt");

readStream.pipe(writeStream);

writeStream.on("finish", () => {
  console.log("Data successfully piped and file written!");
});

readStream.on("error", (err) => {
  console.error("An error occurred while reading:", err.message);
});

writeStream.on("error", (err) => {
  console.error("An error occurred while writing:", err.message);
});
