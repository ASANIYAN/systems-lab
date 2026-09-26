function calculate(operation, left, right) {
  if (operation === "add") {
    return left + right;
  }

  if (operation === "multiply") {
    return left * right;
  }

  throw new Error(`unknown operation: ${operation}`);
}

process.on("message", (request) => {
  console.log("calculator received:", request);

  if (request.type === "shutdown") {
    process.exit(0);
  }

  if (request.type !== "calculate") {
    process.send({
      id: request.id,
      type: "error",
      error: "unknown request type",
    });
    return;
  }

  try {
    const result = calculate(request.operation, request.left, request.right);

    process.send({
      id: request.id,
      type: "calculate-result",
      result,
    });
  } catch (err) {
    process.send({
      id: request.id,
      type: "error",
      error: err.message,
    });
  }
});
