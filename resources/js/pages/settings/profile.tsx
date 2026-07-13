import { Head, usePage } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';
import Heading from '@/components/heading';
import { edit } from '@/routes/profile';

export default function Profile() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile information"
                    description="Your account details as managed by your administrator"
                />

                {/* Admin-only notice */}
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                        Profile details can only be updated by an{' '}
                        <strong>Administrator</strong>. Please contact your
                        admin if you need to make any changes.
                    </p>
                </div>

                {/* Read-only fields */}
                <div className="space-y-5">
                    <div className="grid gap-1">
                        <p className="text-sm font-medium text-foreground">Name</p>
                        <p className="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground select-all">
                            {auth.user.name}
                        </p>
                    </div>

                    <div className="grid gap-1">
                        <p className="text-sm font-medium text-foreground">Username</p>
                        <p className="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground select-all">
                            {auth.user.username}
                        </p>
                    </div>

                    <div className="grid gap-1">
                        <p className="text-sm font-medium text-foreground">Email address</p>
                        <p className="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground select-all">
                            {auth.user.email}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
