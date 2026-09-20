const { spawn } = require("child_process");
const path = require("path");

const mode = process.argv[2] || "normal";

const programA = spawn(process.execPath, [path.join(__dirname, "program-a.js"), mode], {
  stdio: ["ignore", "pipe", "pipe"],
});

const programB = spawn(process.execPath, [path.join(__dirname, "program-b.js"), mode], {
  stdio: ["pipe", "pipe", "pipe"],
});

const programC = spawn(process.execPath, [path.join(__dirname, "program-c.js"), mode], {
  stdio: ["pipe", "pipe", "pipe"],
});

console.log("program A pid:", programA.pid);
console.log("program B pid:", programB.pid);
console.log("program C pid:", programC.pid);
console.log("mode:", mode);

programA.stdout.pipe(programB.stdin);
programB.stdout.pipe(programC.stdin);
programC.stdout.pipe(process.stdout);

for (const [name, child] of [
  ["A", programA],
  ["B", programB],
  ["C", programC],
]) {
  child.stderr.on("data", (chunk) => {
    process.stderr.write(`program ${name} stderr: ${chunk}`);
  });

  child.on("close", (code, signal) => {
    console.log(`program ${name} close code:`, code);
    console.log(`program ${name} close signal:`, signal);
  });
}
