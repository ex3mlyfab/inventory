import { Link, usePage } from '@inertiajs/react';
import { Activity } from 'lucide-react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { branding } = usePage().props as any;

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#f6fbf6] p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#181d1a]">
                                {branding?.app_logo ? (
                                    <img src={branding.app_logo} alt={branding.app_name} className="h-8 w-8 object-contain" />
                                ) : (
                                    <Activity className="h-6 w-6 text-white" strokeWidth={2.5} />
                                )}
                            </div>
                            <span className="text-lg font-bold text-[#181d1a]">
                                {branding?.app_name || 'MedStock'}
                            </span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-semibold text-[#181d1a]">{title}</h1>
                            <p className="text-center text-sm text-[#6D7175]">
                                {description}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-lg border border-[#E1E3E5] bg-white p-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
