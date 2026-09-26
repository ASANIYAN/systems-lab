console.log("child process pid:", process.pid);
console.log("child parent pid:", process.ppid);

process.on("message", (message) => {
  console.log("child received:", message);
  console.log("child received type:", typeof message);

  if (message.type === "greeting") {
    process.send({
      type: "reply",
      text: "hello parent",
      receivedType: message.type,
    });

    return;
  }

  if (message.type === "mutable-test") {
    process.send({
      type: "mutable-test-result",
      countReceived: message.count,
    });

    process.disconnect();
  }
});
