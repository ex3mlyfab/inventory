import { Activity } from 'lucide-react';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#008060]">
                <Activity className="size-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-bold text-sidebar-foreground">
                    MedStock
                </span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                    FMC Inventory
                </span>
            </div>
        </>
    );
}
