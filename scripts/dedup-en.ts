import * as fs from "fs";
const content = fs.readFileSync("src/i18n/en.ts", "utf8");
const lines = content.split("\n");
const seen = new Set<string>();
const result: string[] = [];
for (const line of lines) {
  const trimmed = line.trimStart();
  const indent = line.slice(0, line.length - trimmed.length);
  const match = trimmed.match(/^"(.+?)":/);
  if (!match) {
    result.push(line);
    continue;
  }
  const key = match[1];
  if (seen.has(key)) continue;
  seen.add(key);
  result.push(line);
}
fs.writeFileSync("src/i18n/en.ts", result.join("\n"), "utf8");
console.log(`Deduplicated: ${lines.length} -> ${result.length} lines`);
