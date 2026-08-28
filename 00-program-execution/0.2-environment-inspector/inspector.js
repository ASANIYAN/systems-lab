function inspector() {
  console.log(process.env.FOO);

  process.env.FOO = "changed-by-my-own-code";

  setTimeout(() => {
    console.log(process.env.FOO);
  }, 3000);
}

inspector();
