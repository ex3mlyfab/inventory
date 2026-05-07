import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    FileText, 
    Download, 
    Calendar as CalendarIcon, 
    FileSpreadsheet, 
    ChevronRight,
    Search,
    Loader2,
    Database,
    X,
    Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface ReportType {
    id: string;
    name: string;
    description: string;
}

interface Props {
    reportTypes: ReportType[];
}

export default function ExportCenter({ reportTypes }: Props) {
    const [exporting, setExporting] = React.useState<string | null>(null);
    const [startDate, setStartDate] = React.useState('');
    const [endDate, setEndDate] = React.useState('');
    const [isQueryBuilderOpen, setIsQueryBuilderOpen] = React.useState(false);
    
    // Query Builder State
    const [selectedModel, setSelectedModel] = React.useState('StockBatch');
    const [selectedFormat, setSelectedFormat] = React.useState<'pdf' | 'csv'>('csv');

    const handleExport = (type: string, format: 'pdf' | 'excel', customPath?: string, extraParams: any = {}) => {
        setExporting(`${type}-${format}`);
        
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = customPath || '/reports/export';
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        const inputs = [
            { name: '_token', value: csrfToken || '' },
            { name: 'type', value: type },
            { name: 'format', value: format },
            { name: 'start_date', value: startDate },
            { name: 'end_date', value: endDate },
            ...Object.entries(extraParams).map(([name, value]) => ({ name, value: String(value) }))
        ];

        inputs.forEach(data => {
            if (data.value) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = data.name;
                input.value = data.value;
                form.appendChild(input);
            }
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        
        setTimeout(() => {
            setExporting(null);
            if (!customPath) toast.success(`${type.replace(/_/g, ' ')} export initiated`);
        }, 2000);
    };

    const runCustomQuery = () => {
        setIsQueryBuilderOpen(false);
        toast.info(`Running custom query for ${selectedModel}...`);
        handleExport('custom', selectedFormat === 'csv' ? 'excel' : 'pdf', '/reports/export/query', {
            model: selectedModel,
            format: selectedFormat
        });
    };

    return (
        <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto w-full">
            <Head title="Export Center" />

            <PageHeader 
                title="Export Center" 
                description="Generate and download detailed inventory and financial reports in PDF or Excel format."
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <Card className="lg:col-span-1 h-fit border-border/50 shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Global Parameters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <DateRangePicker 
                            startDate={startDate}
                            endDate={endDate}
                            onStartDateChange={setStartDate}
                            onEndDateChange={setEndDate}
                            label="Report Temporal Scope"
                        />
                        
                        <div className="space-y-2 pt-2 border-t border-border/50">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Search Keywords</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Filter reports..." className="pl-10 text-xs h-10 rounded-xl bg-white border-border/60" />
                            </div>
                        </div>

                        {(startDate || endDate) && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full text-[10px] font-bold uppercase text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                            >
                                <X className="h-3 w-3 mr-2" />
                                Reset Temporal Filters
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Report Types Grid */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reportTypes.map((report) => (
                        <Card key={report.id} className="group border-border/50 hover:border-primary/30 transition-all hover:shadow-lg overflow-hidden border-l-4 border-l-transparent hover:border-l-primary bg-white">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-9 w-9 rounded-xl text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20"
                                            onClick={() => handleExport(report.id, 'excel')}
                                            disabled={!!exporting}
                                            title="Export as CSV/Excel"
                                        >
                                            {exporting === `${report.id}-excel` ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                                        </Button>
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-9 w-9 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100"
                                            onClick={() => handleExport(report.id, 'pdf')}
                                            disabled={!!exporting}
                                            title="Export as PDF"
                                        >
                                            {exporting === `${report.id}-pdf` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{report.name}</CardTitle>
                                <CardDescription className="text-sm line-clamp-2 mt-1 min-h-[40px]">{report.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-1 rounded">
                                        {startDate || endDate ? `Filtered Dataset` : 'Full Archive'}
                                    </span>
                                    <div className="flex items-center text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                                        Select Format
                                        <ChevronRight className="h-3 w-3 ml-1" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Query Builder Entry */}
                    <Card className="md:col-span-2 border-dashed border-2 border-primary/20 bg-primary/5 flex items-center justify-center p-12 group hover:bg-primary/[0.08] transition-all hover:border-primary">
                        <div className="text-center">
                            <div className="h-20 w-20 rounded-[2.5rem] bg-white border border-primary/20 shadow-sm mx-auto flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                <Database className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-primary">Advanced Synthesizer</h3>
                            <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto leading-relaxed">
                                Curate specialized datasets by defining custom model relationships, 
                                temporal boundaries, and granular field filters.
                            </p>
                            
                            <Dialog open={isQueryBuilderOpen} onOpenChange={setIsQueryBuilderOpen}>
                                <DialogTrigger asChild>
                                    <Button className="mt-8 rounded-2xl font-bold h-12 px-12 bg-primary hover:bg-primary-dark shadow-xl hover:shadow-primary/20 transition-all uppercase text-xs tracking-widest">
                                        Launch Query Builder
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[550px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                                    <div className="bg-primary p-8 text-white relative overflow-hidden">
                                        <Database className="absolute -right-8 -bottom-8 h-48 w-48 opacity-10" />
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-bold">Query Synthesizer</DialogTitle>
                                            <DialogDescription className="text-white/70">
                                                Select a data architecture and apply specific filters.
                                            </DialogDescription>
                                        </DialogHeader>
                                    </div>
                                    
                                    <div className="p-8 space-y-8 bg-white">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Entity Architecture</label>
                                            <select 
                                                value={selectedModel}
                                                onChange={(e) => setSelectedModel(e.target.value)}
                                                className="flex h-12 w-full rounded-2xl border border-input bg-muted/30 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            >
                                                <option value="StockBatch">Inventory Batches</option>
                                                <option value="StockMovement">Stock Movements</option>
                                                <option value="Product">Product Catalog</option>
                                                <option value="Supplier">Supplier Directory</option>
                                            </select>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Export Format</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <Button 
                                                    variant={selectedFormat === 'csv' ? 'default' : 'outline'}
                                                    className="rounded-2xl h-12 font-bold transition-all"
                                                    onClick={() => setSelectedFormat('csv')}
                                                >
                                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                                    CSV / Excel
                                                </Button>
                                                <Button 
                                                    variant={selectedFormat === 'pdf' ? 'default' : 'outline'}
                                                    className="rounded-2xl h-12 font-bold transition-all"
                                                    onClick={() => setSelectedFormat('pdf')}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    PDF Document
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="p-6 rounded-2xl border border-dashed border-primary/20 bg-primary/5 flex flex-col items-center gap-2">
                                            <p className="text-[11px] font-bold text-primary uppercase tracking-widest">Temporal scope included</p>
                                            <p className="text-xs text-muted-foreground">
                                                {startDate && endDate ? `${startDate} to ${endDate}` : 'No date range applied. Full dataset will be exported.'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="px-8 pb-8 flex gap-3 bg-white">
                                        <Button variant="ghost" onClick={() => setIsQueryBuilderOpen(false)} className="rounded-2xl h-12 px-8 font-bold text-muted-foreground">Cancel</Button>
                                        <Button className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20" onClick={runCustomQuery}>
                                            Synthesize Report
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// @ts-ignore
ExportCenter.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/' },
        { title: 'Reports', href: '/reports' },
        { title: 'Export Center', href: '/reports/export' },
    ]
};
