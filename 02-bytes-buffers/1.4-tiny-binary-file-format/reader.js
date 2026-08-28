const fs = require("fs");
const buffer = fs.readFileSync("data.tiny");

const magic_num = buffer.subarray(0, 4);

if (magic_num.toString("utf8") !== "TINY") {
  throw new Error("Not a valid TINY file");
}

const version = buffer.subarray(4, 5);
const length = buffer.subarray(5, 7);
const length_val = length.readUInt16BE();
const data = buffer.subarray(7, 7 + length_val);

console.log(
  "reader data: \n",
  `magic_num: ${magic_num.toString("utf8")}`,
  `version: ${version.readInt8()}`,
  `length: ${length_val}`,
  `data: ${data.toString("utf8")}`,
);
