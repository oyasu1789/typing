const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const input = path.join(root, "fire_prevention_typing_words.csv");
const output = path.join(root, "fire_prevention_words_fallback.js");
const csv = fs.readFileSync(input, "utf8");

fs.writeFileSync(
  output,
  `window.FIRE_PREVENTION_WORDS_CSV = ${JSON.stringify(csv)};\n`,
  "utf8",
);

console.log(`Generated ${path.basename(output)} from ${path.basename(input)}`);
