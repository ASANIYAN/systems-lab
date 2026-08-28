function events(params) {
  const { EventEmitter } = require("events");
  const emitter = new EventEmitter();

  // Case 1: emit BEFORE listening — predict: nothing happens
  emitter.emit("created", { id: 1, name: "too early" });

  // Case 2: attach listener, THEN emit — predict: listener fires
  emitter.on("created", (data) => {
    console.log("received:", data);
  });

  emitter.emit("created", { id: 2, name: "on time" });
}

events();
