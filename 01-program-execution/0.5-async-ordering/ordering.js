function ordering(params) {
  console.log("A");

  setTimeout(() => {
    console.log("B");
  }, 0);

  Promise.resolve().then(() => {
    console.log("C1");
    Promise.resolve().then(() => {
      console.log("C2");
    });
  });

  console.log("D");
}

ordering();
