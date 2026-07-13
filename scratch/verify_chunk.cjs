const fs = require('fs');
const f = fs.readFileSync('./public/build/assets/Show-DN2tyLYB.js', 'utf8');
console.log('Has CheckboxPrimitive:', f.includes('CheckboxPrimitive'));
console.log('Has react-presence (in Show chunk):', f.includes('react-presence'));
console.log('Has polyline (our custom SVG):', f.includes('polyline'));
console.log('Size:', f.length, 'bytes');
