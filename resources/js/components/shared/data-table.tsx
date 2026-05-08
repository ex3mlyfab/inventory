import React, { ReactNode } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

export interface Column<T> {
    header: string;
    id?: string;
    accessorKey?: keyof T;
    cell?: (item: T) => ReactNode;
    className?: string;
}

export interface PaginationMeta {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (item: T) => string | number;
    meta?: PaginationMeta;
    headerBackground?: string;
    emptyMessage?: string | ReactNode;
    onRowClick?: (item: T) => void;
    className?: string;
}

export function DataTable<T>({
    data = [],
    columns,
    keyExtractor,
    meta,
    headerBackground,
    emptyMessage = 'No results found.',
    onRowClick,
    className,
}: DataTableProps<T>) {
    return (
        <div className={cn('flex flex-col w-full', className)}>
            <div className="rounded-md border border-border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className={cn('bg-surface-header', headerBackground)}>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead
                                    key={column.id ?? column.header ?? column.accessorKey?.toString()}
                                    className={cn(
                                        'text-xs font-semibold uppercase tracking-wider text-text-secondary h-12',
                                        column.className
                                    )}
                                >
                                    {column.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-text-muted"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow
                                    key={keyExtractor(item)}
                                    onClick={() => onRowClick?.(item)}
                                    className={cn(
                                        'h-12',
                                        onRowClick && 'cursor-pointer hover:bg-surface-hover'
                                    )}
                                >
                                    {columns.map((column, index) => (
                                        <TableCell
                                            key={index}
                                            className={cn('text-sm text-text-primary', column.className)}
                                        >
                                            {column.cell
                                                ? column.cell(item)
                                                : column.accessorKey
                                                  ? String(item[column.accessorKey] ?? '')
                                                  : null}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between py-4 select-none">
                    <div className="text-sm text-text-muted">
                        Showing <span className="font-medium text-text-primary">{meta.from}</span> to{' '}
                        <span className="font-medium text-text-primary">{meta.to}</span> of{' '}
                        <span className="font-medium text-text-primary">{meta.total}</span> results
                    </div>
                    <div className="flex items-center gap-1">
                        {meta.links.map((link, index) => {
                            const isPrev = link.label.includes('Previous');
                            const isNext = link.label.includes('Next');

                            let label = link.label
                                .replace(/&laquo;/g, '«')
                                .replace(/&raquo;/g, '»');
                            if (isPrev) label = '←';
                            if (isNext) label = '→';

                            if (!link.url) {
                                return (
                                    <div
                                        key={index}
                                        className="h-8 px-3 flex items-center justify-center rounded-md border border-border text-sm font-medium text-text-muted bg-surface cursor-not-allowed opacity-50"
                                    >
                                        {label}
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={cn(
                                        'h-8 min-w-[32px] px-3 flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                                        link.active
                                            ? 'bg-brand text-brand-foreground border border-brand'
                                            : 'bg-white text-text-primary border border-border hover:bg-surface-hover'
                                    )}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
