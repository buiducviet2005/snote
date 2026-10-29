const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('frontend/src');
const coloredIcons = [];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Check for inline colors in icon tags or color props on Lucide icons or svg paths
    if (/(?:color|fill|stroke)\s*[:=]\s*['"]#(?:(?!000|fff|ffffff|000000)[0-9a-fA-F]{3,8})['"]/i.test(line) ||
        /<svg[^>]*>/.test(line)) {
      coloredIcons.push({ file: f, line: idx + 1, text: line.trim() });
    }
  });
});

console.log(`Found ${coloredIcons.length} potential colored icon / SVG lines:`);
const byFile = {};
coloredIcons.forEach(item => {
  if (!byFile[item.file]) byFile[item.file] = [];
  byFile[item.file].push(item);
});

Object.keys(byFile).forEach(f => {
  console.log(`\n=== ${f} (${byFile[f].length}) ===`);
  byFile[f].slice(0, 5).forEach(x => {
    console.log(`  L${x.line}: ${x.text.substring(0, 100)}`);
  });
});
