const { spawn } = require("child_process");
const path = require("path");

const mode = process.argv[2] || "success";
const childPath = path.join(__dirname, "worker.js");
const command = mode === "missing" ? "not-a-real-command" : process.execPath;
const args = mode === "missing" ? [] : [childPath, mode];

const child = spawn(command, args, {
  stdio: "pipe",
});

console.log("monitor pid:", process.pid);
console.log("started child pid:", child.pid);
console.log("mode:", mode);

if (mode === "wait") {
  setTimeout(() => {
    console.log("sending SIGTERM to child");
    child.kill("SIGTERM");
  }, 1000);
}

child.stdout.on("data", (chunk) => {
  process.stdout.write(`child stdout: ${chunk}`);
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(`child stderr: ${chunk}`);
});

child.on("error", (err) => {
  console.error("child start error:", err.message);
});

child.on("exit", (code, signal) => {
  console.log("child exit code:", code);
  console.log("child exit signal:", signal);
});

child.on("close", (code, signal) => {
  console.log("child close code:", code);
  console.log("child close signal:", signal);
});
