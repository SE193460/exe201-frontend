const fs = require('fs');
const content = fs.readFileSync('src/i18n/en.ts', 'utf8');
const lines = content.split('\n');
const seen = new Set();
const result = [];
for (const line of lines) {
  const match = line.match(/^\s+"(.+?)":/);
  if (!match) {
    result.push(line);
    continue;
  }
  const key = match[1];
  if (seen.has(key)) continue;
  seen.add(key);
  result.push(line);
}
fs.writeFileSync('src/i18n/en.ts', result.join('\n'), 'utf8');
console.log(lines.length + ' -> ' + result.length);
