const { spawn } = require("child_process");
const path = require("path");

const child = spawn(process.execPath, [path.join(__dirname, "calculator.js")], {
  stdio: ["inherit", "inherit", "inherit", "ipc"],
});

const pending = new Map();

function sendRequest(request) {
  pending.set(request.id, request);
  console.log("parent sent:", request);
  child.send(request);
}

child.on("message", (response) => {
  const request = pending.get(response.id);

  console.log("parent received:", response);
  console.log("matched request:", request);

  pending.delete(response.id);

  if (pending.size === 0) {
    child.send({
      type: "shutdown",
    });
  }
});

child.on("close", (code, signal) => {
  console.log("calculator close code:", code);
  console.log("calculator close signal:", signal);
});

sendRequest({
  id: 1,
  type: "calculate",
  operation: "add",
  left: 2,
  right: 3,
});

sendRequest({
  id: 2,
  type: "calculate",
  operation: "multiply",
  left: 4,
  right: 5,
});

sendRequest({
  id: 3,
  type: "calculate",
  operation: "divide",
  left: 10,
  right: 2,
});
