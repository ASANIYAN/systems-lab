const mode = process.argv[2] || "success";

console.log("worker pid:", process.pid);
console.log("worker mode:", mode);

if (mode === "success") {
  console.log("worker completed successfully");
  process.exit(0);
}

if (mode === "fail") {
  console.error("worker failed on purpose");
  process.exit(7);
}

if (mode === "wait") {
  console.log("worker waiting");
  setInterval(() => {}, 1000);
  return;
}

console.error("unknown mode:", mode);
process.exit(1);
