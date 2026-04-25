import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(dirPath);
    });
}

walk('./resources/js/pages/Inventory', (filepath) => {
    if (!filepath.endsWith('.tsx')) return;
    if (filepath.includes('Components')) return; // skip components

    let content = fs.readFileSync(filepath, 'utf8');

    // 1. Remove import AppLayout
    content = content.replace(/import AppLayout from ['"]@\/layouts\/app-layout['"];?\n?/, '');

    // 2. Extract component name
    let componentNameMatch = content.match(/export default function ([A-Za-z0-9_]+)/);
    if (!componentNameMatch) return;
    let componentName = componentNameMatch[1];
    
    if (content.includes(`${componentName}.layout =`)) return; // already fixed

    // 3. Extract breadcrumbs and convert
    let breadcrumbsStr = '';
    const breadcrumbRegex = /<AppLayout\s*breadcrumbs=\{\[([\s\S]*?)\]\}\s*>/;
    let match = content.match(breadcrumbRegex);
    if (match) {
        let inner = match[1];
        // replace `label:` with `title:`, `url:` with `href:`
        inner = inner.replace(/label:/g, 'title:');
        inner = inner.replace(/url:/g, 'href:');
        // If some breadcrumbs don't have an href, ensure they have something or we just assign a placeholder OR `#`
        // Wait, BreadcrumbItem requires `href: NonNullable<InertiaLinkProps['href']>`. 
        // So they MUST have href. If they lacked it, we add `href: '#'`
        inner = inner.split('}').map(part => {
            if (!part.trim() || part.trim() === ',') return part;
            if (!part.includes('href:')) {
                return part + ", href: '#' ";
            }
            return part;
        }).join('}');
        
        breadcrumbsStr = `\n${componentName}.layout = {\n    breadcrumbs: [\n${inner}\n    ],\n};\n`;
        
        content = content.replace(breadcrumbRegex, '<>');
    } else {
        // Fallback or no breadcrumbs
        content = content.replace(/<AppLayout>/, '<>');
        breadcrumbsStr = `\n${componentName}.layout = {\n    breadcrumbs: [\n    ],\n};\n`;
    }

    // 4. Replace closing tag
    content = content.replace(/<\/AppLayout>/g, '</>');
    
    // 5. Append
    content += breadcrumbsStr;
    
    fs.writeFileSync(filepath, content);
});

console.log("Done fixing layouts");
