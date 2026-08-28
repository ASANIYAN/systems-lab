const bufBE = Buffer.alloc(2);
bufBE.writeUInt16BE(300);

const bufLE = Buffer.alloc(2);
bufLE.writeUInt16LE(300);

console.log("read BE correctly:", bufBE.readUInt16BE());
console.log("read LE correctly:", bufLE.readUInt16LE());

console.log("bufBE misread as LE:", bufBE.readUInt16LE());
console.log("bufLE misread as BE:", bufLE.readUInt16BE());
