import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Requisition, RequisitionItem } from '@/types/inventory';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    requisition: Requisition & { items: RequisitionItem[] };
    hospital_name: string;
}

export default function PrintReleaseForm({ requisition, hospital_name }: Props) {
    useEffect(() => {
        // Automatically trigger print dialog when page loads
        const timer = setTimeout(() => {
            window.print();
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const isInternal = requisition.type === 'internal';

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 print:p-0 print:bg-white">
            <Head title={`Release Form: ${requisition.reference}`} />

            {/* Print Controls - Hidden during print */}
            <div className="max-w-[21cm] mx-auto mb-6 flex items-center justify-between print:hidden">
                <Button 
                    variant="ghost" 
                    className="text-slate-600 hover:text-slate-900"
                    onClick={() => window.history.back()}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button 
                    onClick={() => window.print()}
                    className="bg-brand hover:bg-brand/90 text-white shadow-lg px-6"
                >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Document
                </Button>
            </div>

            {/* A4 Sheet */}
            <div className="bg-white mx-auto shadow-2xl p-[1.5cm] min-h-[29.7cm] w-[21cm] print:shadow-none print:m-0 print:w-full print:min-h-0">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter">{hospital_name}</h1>
                        <p className="text-sm font-bold text-gray-600 uppercase tracking-widest mt-1">Inventory & Supply Chain Management</p>
                        <h2 className="text-xl font-bold mt-4 uppercase underline decoration-2 underline-offset-4">Stock Release Authorization</h2>
                    </div>
                    <div className="text-right">
                        <div className="bg-black text-white px-4 py-2 inline-block font-mono text-lg font-bold">
                            {requisition.reference}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mt-2">{new Date().toLocaleString()}</p>
                    </div>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-12 mb-10">
                    <div className="space-y-4">
                        <div className="border-l-4 border-gray-200 pl-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Source (Issuing Location)</p>
                            <p className="text-sm font-bold">{requisition.issuing_location?.name || 'Main Store'}</p>
                            <p className="text-xs font-mono text-gray-500">{requisition.issuing_location?.code}</p>
                        </div>
                        <div className="border-l-4 border-black pl-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Destination (Requesting Unit)</p>
                            <p className="text-sm font-bold">
                                {isInternal 
                                    ? (requisition.requesting_location?.name || '—') 
                                    : (requisition.requesting_department?.name || '—')}
                            </p>
                            <p className="text-xs text-gray-500">
                                 {isInternal ? `Store Code: ${requisition.requesting_location?.code}` : 'Departmental Unit'}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="border-r-4 border-gray-200 pr-4 text-right">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Requested By</p>
                            <p className="text-sm font-bold">{requisition.requester?.name}</p>
                            <p className="text-xs text-gray-500">Date: {new Date(requisition.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="border-r-4 border-black pr-4 text-right">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Approved By (MD)</p>
                            <p className="text-sm font-bold">{requisition.level2_approver?.name}</p>
                            <p className="text-xs text-gray-500">Decision Date: {new Date(requisition.level2_approved_at!).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-12">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b-2 border-black bg-gray-50">
                                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest">S/N</th>
                                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest">Description</th>
                                <th className="py-3 px-4 text-center text-[10px] font-black uppercase tracking-widest">Requested</th>
                                <th className="py-3 px-4 text-center text-[10px] font-black uppercase tracking-widest">Approved</th>
                                <th className="py-3 px-4 text-center text-[10px] font-black uppercase tracking-widest">Issued</th>
                                <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-widest">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requisition.items.map((item, idx) => (
                                <tr key={item.id} className="border-b border-gray-200">
                                    <td className="py-3 px-4 text-xs font-mono">{idx + 1}</td>
                                    <td className="py-3 px-4">
                                        <p className="text-sm font-bold">{item.product?.name}</p>
                                        <p className="text-[10px] font-mono text-gray-500">{item.product?.sku}</p>
                                    </td>
                                    <td className="py-3 px-4 text-center text-xs font-bold">{item.quantity_requested}</td>
                                    <td className="py-3 px-4 text-center text-sm font-black">{item.quantity_approved}</td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="h-6 w-16 border-b border-dotted border-black mx-auto" />
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="h-6 w-24 border-b border-dotted border-black ml-auto" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Purpose */}
                <div className="mb-12 p-4 bg-gray-50 border border-gray-200">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Purpose / Justification</p>
                    <p className="text-sm italic">"{requisition.purpose || 'Official Stock Transfer'}"</p>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-8 mt-20 pt-10 border-t border-gray-100">
                    <div className="space-y-8">
                        <div className="border-b border-black h-12 flex items-end pb-1 font-mono text-xs">
                            {requisition.level2_approver?.name}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Authorizing Officer (MD)</p>
                    </div>
                    
                    <div className="space-y-8">
                        <div className="border-b border-black h-12" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Issuing Officer (Store)</p>
                        <div className="pt-2">
                            <p className="text-[9px] text-gray-400">Name: _______________________</p>
                            <p className="text-[9px] text-gray-400 mt-2">Sign: _______________________</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="border-b-2 border-black h-12 bg-gray-50/50" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-black">Collector (Signature & Date)</p>
                        <div className="pt-2">
                            <p className="text-xs font-bold">Name: _______________________</p>
                            <p className="text-[9px] text-gray-400 mt-2">ID No: _______________________</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-[8px] text-gray-400 font-mono uppercase tracking-[0.2em]">
                    This is a secure system-generated document. Unauthorized alteration is a criminal offense.
                    <br />
                    Document Hash: {btoa(requisition.id).substring(0, 16)}
                </div>
            </div>

            {/* Print styles override */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { 
                        size: A4; 
                        margin: 1.5cm; 
                    }
                    body { 
                        background: white !important;
                        -webkit-print-color-adjust: exact; 
                    }
                    .print\\:hidden { display: none !important; }
                }
            `}} />
        </div>
    );
}

