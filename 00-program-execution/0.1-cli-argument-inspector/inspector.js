function argType(arg) {
  if (typeof arg !== "string") return;

  if (arg.startsWith("--")) {
    return "flag";
  } else if (!isNaN(Number(arg))) {
    return "number";
  }

  return "string";
}

function inspector() {
  const args = process.argv.slice(2);
  console.log(args, "arguments");

  args.forEach((arg, i) => {
    console.log(`index ${i}: ${arg} -> type: ${argType(arg)}`);
  });
}

inspector();
