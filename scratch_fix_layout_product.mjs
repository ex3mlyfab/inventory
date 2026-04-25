import fs from 'fs';

const files = [
    './resources/js/pages/Inventory/Products/Show.tsx',
    './resources/js/pages/Inventory/Products/Edit.tsx',
    './resources/js/pages/Inventory/Stock/Batches.tsx'
];

files.forEach(filepath => {
    if (!fs.existsSync(filepath)) return;
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Replace any dynamic { title: product.name... } with a static one
    content = content.replace(/\{\s*title:\s*product\.name\s*,.*?\}/g, "{ title: 'Product Details', href: '#' }");
    
    fs.writeFileSync(filepath, content);
});

console.log('Fixed ReferenceErrors in layout');
