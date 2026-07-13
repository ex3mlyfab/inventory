const fs = require('fs');
const src = fs.readFileSync('./public/build/assets/app-DX1gbcus.js', 'utf8');
const lines = src.split('\n');
console.log('Total lines:', lines.length);

// Line 98 = index 97, line 97 = index 96
const line98 = lines[97] || '';
const line97 = lines[96] || '';

console.log('Line 97 length:', line97.length);
console.log('Line 98 length:', line98.length);

// Look around position 137312 in line 98 (0-indexed: line index 97)
console.log('\n=== Line 98 around position 137312 ===');
console.log(line98.substring(137200, 137450));

// Look around position 95954 in line 98 (the Do function - React fiber)
console.log('\n=== Line 98 around position 95954 (Do - React fiber) ===');
console.log(line98.substring(95900, 96100));

// Look around position 27486 in line 97 (the ei function - Lucide render)
console.log('\n=== Line 97 around position 27486 (ei - createLucideIcon render) ===');
console.log(line97.substring(27400, 27600));
