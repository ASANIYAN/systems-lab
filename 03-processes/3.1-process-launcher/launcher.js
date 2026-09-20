const { spawn } = require("child_process");
const path = require("path");

console.log("launcher pid:", process.pid);

const childPath = path.join(__dirname, "child.js");
const child = spawn(process.execPath, [childPath, "hello", "from", "parent"], {
  stdio: "pipe",
});

console.log("spawned child pid:", child.pid);

child.stdout.on("data", (chunk) => {
  process.stdout.write(`from child stdout: ${chunk}`);
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(`from child stderr: ${chunk}`);
});

child.on("exit", (code, signal) => {
  console.log("child exit code:", code);
  console.log("child exit signal:", signal);
});

child.on("error", (err) => {
  console.error("failed to start child:", err.message);
});
