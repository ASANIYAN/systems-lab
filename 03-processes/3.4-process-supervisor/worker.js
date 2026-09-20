const attempt = Number(process.argv[2]);
const failuresBeforeSuccess = Number(process.argv[3]);

console.log("worker attempt:", attempt);

if (attempt <= failuresBeforeSuccess) {
  console.error("worker failed on purpose");
  process.exit(1);
}

console.log("worker succeeded");
process.exit(0);
