function encode(str) {
  return [...str].map((char) => char.charCodeAt(0));
}

function decode(arr) {
  if (!Array.isArray(arr)) {
    return;
  }

  const decodedArray = arr.map((item) => String.fromCharCode(item));

  return decodedArray.join("");
}

console.log(encode("hello"));
console.log(encode("café"));
console.log(decode(encode("hello")));
console.log(decode(encode("café")));

console.log(Buffer.from("café"));
console.log(encode("café"));
