import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { router } from '@inertiajs/react';

interface ProductSearchProps {
    initialSearch?: string;
    routeName?: string;
    routePath?: string;
    placeholder?: string;
}

export function ProductSearch({ initialSearch = '', routeName, routePath, placeholder = 'Search products by name or SKU...' }: ProductSearchProps) {
    const [search, setSearch] = useState(initialSearch);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (search !== initialSearch) {
                const url = routePath || (routeName ? route(routeName) : window.location.pathname);
                router.get(
                    url,
                    { search: search || undefined },
                    { preserveState: true, replace: true }
                );
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search, routeName, routePath, initialSearch]);

    return (
        <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="pl-9 h-9"
            />
        </div>
    );
}
