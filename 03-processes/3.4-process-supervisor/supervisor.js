const { spawn } = require("child_process");
const path = require("path");

const failuresBeforeSuccess = Number(process.argv[2] || 0);
const maxAttempts = 3;
let attempt = 0;

function startWorker() {
  attempt += 1;

  console.log("starting worker attempt:", attempt);

  const worker = spawn(
    process.execPath,
    [path.join(__dirname, "worker.js"), String(attempt), String(failuresBeforeSuccess)],
    {
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  console.log("worker pid:", worker.pid);

  worker.stdout.on("data", (chunk) => {
    process.stdout.write(`worker stdout: ${chunk}`);
  });

  worker.stderr.on("data", (chunk) => {
    process.stderr.write(`worker stderr: ${chunk}`);
  });

  worker.on("close", (code, signal) => {
    console.log("worker close code:", code);
    console.log("worker close signal:", signal);

    if (code === 0) {
      console.log("worker succeeded, supervisor stopping");
      return;
    }

    if (attempt >= maxAttempts) {
      console.log("max attempts reached, supervisor giving up");
      return;
    }

    console.log("worker failed, restarting");
    startWorker();
  });
}

startWorker();
