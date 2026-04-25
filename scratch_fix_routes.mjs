import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(dirPath);
    });
}

const replacer = (content) => {
    // Basic route replaces
    content = content.replace(/route\(['"]inventory\.products\.index['"]\)/g, "'/inventory/products'");
    content = content.replace(/route\(['"]inventory\.products\.create['"]\)/g, "'/inventory/products/create'");
    content = content.replace(/route\(['"]inventory\.products\.store['"]\)/g, "'/inventory/products'");
    content = content.replace(/route\(['"]inventory\.products\.show['"],\s*([^)]+)\)/g, "`/inventory/products/${$1}`");
    content = content.replace(/route\(['"]inventory\.products\.edit['"],\s*([^)]+)\)/g, "`/inventory/products/${$1}/edit`");
    content = content.replace(/route\(['"]inventory\.products\.update['"],\s*([^)]+)\)/g, "`/inventory/products/${$1}`");
    
    content = content.replace(/route\(['"]inventory\.categories\.index['"]\)/g, "'/inventory/categories'");
    content = content.replace(/route\(['"]inventory\.categories\.store['"]\)/g, "'/inventory/categories'");
    
    content = content.replace(/route\(['"]inventory\.stock\.index['"]\)/g, "'/inventory/stock'");
    content = content.replace(/route\(['"]inventory\.stock\.batches['"],\s*([^)]+)\)/g, "`/inventory/stock/${$1}/batches`");
    
    content = content.replace(/route\(['"]inventory\.stock-movements\.index['"]\)/g, "'/inventory/stock-movements'");
    content = content.replace(/route\(['"]inventory\.stock-adjustments\.index['"]\)/g, "'/inventory/stock-adjustments'");
    content = content.replace(/route\(['"]inventory\.stock-adjustments\.store['"]\)/g, "'/inventory/stock-adjustments'");
    
    // Dynamic string like `inventory.stock-adjustments.${actionType}`
    content = content.replace(/route\(`inventory\.stock-adjustments\.\$\{([^}]+)\}`,\s*([^)]+)\)/g, "`/inventory/stock-adjustments/${$2}/${$1}`");

    return content;
};

walk('./resources/js/pages/Inventory', (filepath) => {
    if (!filepath.endsWith('.tsx')) return;
    let content = fs.readFileSync(filepath, 'utf8');
    
    if (filepath.includes('ProductSearch.tsx')) {
        content = content.replace(/routeName: string;/g, "routePath: string;");
        content = content.replace(/routeName,/g, "routePath,");
        content = content.replace(/route\(routeName\),/g, "routePath,");
    } else {
        // Also update components that use ProductSearch to pass routePath instead of routeName
        content = content.replace(/routeName=(['"])inventory\.products\.index\1/g, "routePath='/inventory/products'");
        content = content.replace(/routeName=(['"])inventory\.stock\.index\1/g, "routePath='/inventory/stock'");
    }

    let newContent = replacer(content);
    if (newContent !== content) {
        fs.writeFileSync(filepath, newContent);
    }
});
console.log("Done fixing routes");
