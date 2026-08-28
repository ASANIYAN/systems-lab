function encodeMessage(type, payloadStr) {
  const payload = Buffer.from(payloadStr);
  const length = Buffer.alloc(2);
  length.writeUInt16BE(payload.length, 0);

  const typeBuf = Buffer.alloc(1);
  typeBuf.writeUint8(type, 0);

  return Buffer.concat([length, typeBuf, payload]);
}

const msg1 = encodeMessage(1, "hi");
const msg2 = encodeMessage(2, "ping");
const msg3 = encodeMessage(1, "how are you");

const stream = Buffer.concat([msg1, msg2, msg3]);
console.log(stream);

const fs = require("fs");
fs.writeFileSync("stream.bin", stream);

module.exports = encodeMessage;
