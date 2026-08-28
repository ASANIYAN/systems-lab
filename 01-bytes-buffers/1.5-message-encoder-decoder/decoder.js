function decodeStream(buffer) {
  const messages = [];
  let offset = 0;

  while (offset < buffer.length) {
    // read length (2 bytes starting at offset)
    const length = buffer.subarray(offset, offset + 2).readUInt16BE();
    // read type (1 byte, right after length)
    const type = buffer.subarray(offset + 2, offset + 3).readUInt8();
    // read payload (length bytes, right after type)
    const payload = buffer
      .subarray(offset + 3, offset + 3 + length)
      .toString("utf8");
    // push { type, payload } into messages
    messages.push({ type, payload });
    // advance offset by however many total bytes this message used
    offset = offset + 2 + 1 + length;
  }

  return messages;
}

const fs = require("fs");
const buffer = fs.readFileSync("stream.bin");

console.log(decodeStream(buffer));
