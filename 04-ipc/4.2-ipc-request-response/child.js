process.on("message", (request) => {
  console.log("child received:", request);

  if (request.type !== "uppercase") {
    process.send({
      id: request.id,
      type: "error",
      error: "unknown request type",
    });
    return;
  }

  const delay = request.id === 1 ? 100 : 10;

  setTimeout(() => {
    process.send({
      id: request.id,
      type: "uppercase-result",
      text: request.text.toUpperCase(),
    });
  }, delay);
});
