const { spawn } = require("child_process");
const path = require("path");

const child = spawn(process.execPath, [path.join(__dirname, "child.js")], {
  stdio: ["inherit", "inherit", "inherit", "ipc"],
});

console.log("parent pid:", process.pid);
console.log("child pid:", child.pid);

child.on("message", (message) => {
  console.log("parent received:", message);
  console.log("parent received type:", typeof message);
});

child.on("close", (code, signal) => {
  console.log("child close code:", code);
  console.log("child close signal:", signal);
});

child.send({
  type: "greeting",
  text: "hello child",
});

const mutableMessage = {
  type: "mutable-test",
  count: 1,
};

child.send(mutableMessage);
mutableMessage.count = 999;

console.log("parent mutated message after send:", mutableMessage);
