function hexviewer() {
  const fs = require("fs");
  const data = fs.readFileSync(process.argv[2]);

  let start = 0;
  while (start < data.length) {
    const row = data.subarray(start, start + 16);
    const offset = start;
    const hexView = row.toString("hex");
    let asciiVal = "";

    for (const [index, byte] of row.entries()) {
      if (byte < 32 || byte > 126) {
        asciiVal += ".";
      } else {
        asciiVal += String.fromCharCode(byte);
      }
    }

    console.log(`${offset} ${hexView} ${asciiVal}`);
    start += 16;
  }
}

hexviewer();
