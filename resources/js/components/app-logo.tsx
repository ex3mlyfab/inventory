import { usePage } from '@inertiajs/react';
import { Activity } from 'lucide-react';

export default function AppLogo() {
    const { branding } = usePage().props as any;

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#181d1a]">
                {branding?.app_logo ? (
                    <img src={branding.app_logo} alt={branding.app_name} className="size-6 object-contain" />
                ) : (
                    <Activity className="size-4 text-white" strokeWidth={2.5} />
                )}
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-bold text-sidebar-foreground">
                    {branding?.app_name || 'MedStock'}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                    {branding?.app_tagline || 'Pro Inventory'}
                </span>
            </div>
        </>
    );
}
