const magic_num = Buffer.alloc(4);
magic_num.write("TINY");

const version = Buffer.alloc(1);
version.writeInt8(1, 0); // Correct way to write a numeric byte

const data = Buffer.from("helloworld");

const length = Buffer.alloc(2);
const dataSize = data.length;
length.writeUInt16BE(dataSize, 0); // Correct way to write numbers > 255

console.log("Individual buffers:", magic_num, version, length, data);

const content = Buffer.concat([magic_num, version, length, data]);

console.log("Combined buffer:", content);

const fs = require("fs");
fs.writeFileSync("data.tiny", content);
