const { spawn } = require("child_process");
const path = require("path");

const child = spawn(process.execPath, [path.join(__dirname, "child.js")], {
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
  console.log("matched original request:", request);

  pending.delete(response.id);

  if (pending.size === 0) {
    child.disconnect();
  }
});

child.on("close", (code, signal) => {
  console.log("child close code:", code);
  console.log("child close signal:", signal);
});

sendRequest({
  id: 1,
  type: "uppercase",
  text: "hello",
});

sendRequest({
  id: 2,
  type: "uppercase",
  text: "world",
});
