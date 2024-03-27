const fs = require("fs/promises");
const path = require("path");

const text = "edgeql";

(async function main() {
  const font = JSON.parse(
    await fs.readFile(path.join(__dirname, "./fonts/EdgeDB_Bold.json"), "utf8")
  );
  const filteredGlyphs = {};
  for (const char of new Set(text.split(""))) {
    filteredGlyphs[char] = font.glyphs[char];
  }
  font.glyphs = filteredGlyphs;

  await fs.writeFile(
    path.join(__dirname, "./fonts/EdgeDB_Bold_stripped.jsonfont"),
    JSON.stringify(font)
  );
})();
