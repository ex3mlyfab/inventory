import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { Save, Building, Mail, Phone, Globe, ShieldCheck, Box } from 'lucide-react';
import { Transition } from '@headlessui/react';

interface Props {
    settings: {
        organization_name: string;
        address: string;
        contact_email: string;
        contact_phone: string;
        currency: string;
        timezone: string;
        inventory: {
            low_stock_threshold: number;
            auto_approve_requisitions: boolean;
        }
    };
}

export default function SettingsIndex({ settings }: Props) {
    const { data, setData, post, processing, recentlySuccessful } = useForm({
        organization_name: settings.organization_name,
        address: settings.address,
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        currency: settings.currency,
        timezone: settings.timezone,
        low_stock_threshold: settings.inventory.low_stock_threshold,
        auto_approve_requisitions: settings.inventory.auto_approve_requisitions,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/settings');
    };

    return (
        <>
            <Head title="System Settings" />
            <div className="space-y-6 p-6 max-w-5xl mx-auto">
                <PageHeader
                    title="System Settings"
                    description="Configure global application defaults and organization profiles."
                />

                <form onSubmit={submit} className="space-y-6">
                    {/* Organization Section */}
                    <Card className="border-[#E1E3E5] shadow-sm overflow-hidden">
                        <CardHeader className="bg-[#f9fafb] border-b border-[#E1E3E5]">
                            <div className="flex items-center gap-2">
                                <Building className="h-5 w-5 text-[#008060]" />
                                <div>
                                    <CardTitle className="text-lg font-semibold text-[#1a1c1d]">Organization Profile</CardTitle>
                                    <CardDescription>General information about your institution.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="organization_name">Organization Name</Label>
                                <Input
                                    id="organization_name"
                                    value={data.organization_name}
                                    onChange={e => setData('organization_name', e.target.value)}
                                    className="border-[#babfc3] focus-visible:ring-[#008060]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Physical Address</Label>
                                <Input
                                    id="address"
                                    value={data.address}
                                    onChange={e => setData('address', e.target.value)}
                                    className="border-[#babfc3] focus-visible:ring-[#008060]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact_email">Primary Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6D7175]" />
                                    <Input
                                        id="contact_email"
                                        type="email"
                                        value={data.contact_email}
                                        onChange={e => setData('contact_email', e.target.value)}
                                        className="pl-10 border-[#babfc3] focus-visible:ring-[#008060]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact_phone">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6D7175]" />
                                    <Input
                                        id="contact_phone"
                                        value={data.contact_phone}
                                        onChange={e => setData('contact_phone', e.target.value)}
                                        className="pl-10 border-[#babfc3] focus-visible:ring-[#008060]"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Regional & System Section */}
                    <Card className="border-[#E1E3E5] shadow-sm overflow-hidden">
                        <CardHeader className="bg-[#f9fafb] border-b border-[#E1E3E5]">
                            <div className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-[#008060]" />
                                <div>
                                    <CardTitle className="text-lg font-semibold text-[#1a1c1d]">Regional & System</CardTitle>
                                    <CardDescription>Localized settings for display and calculation.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="currency">System Currency</Label>
                                <Input
                                    id="currency"
                                    value={data.currency}
                                    onChange={e => setData('currency', e.target.value)}
                                    className="border-[#babfc3] focus-visible:ring-[#008060]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="timezone">Default Timezone</Label>
                                <Input
                                    id="timezone"
                                    value={data.timezone}
                                    onChange={e => setData('timezone', e.target.value)}
                                    className="border-[#babfc3] focus-visible:ring-[#008060]"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inventory Defaults Section */}
                    <Card className="border-[#E1E3E5] shadow-sm overflow-hidden">
                        <CardHeader className="bg-[#f9fafb] border-b border-[#E1E3E5]">
                            <div className="flex items-center gap-2">
                                <Box className="h-5 w-5 text-[#008060]" />
                                <div>
                                    <CardTitle className="text-lg font-semibold text-[#1a1c1d]">Inventory Defaults</CardTitle>
                                    <CardDescription>Global thresholds for the inventory management engine.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="low_stock">Low Stock Threshold</Label>
                                <Input
                                    id="low_stock"
                                    type="number"
                                    value={data.low_stock_threshold}
                                    onChange={e => setData('low_stock_threshold', parseInt(e.target.value))}
                                    className="border-[#babfc3] focus-visible:ring-[#008060]"
                                />
                                <p className="text-xs text-[#6D7175]">Alerts will be triggered when stock falls below this level.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Data Management Section */}
                    <Card className="border-[#E1E3E5] shadow-sm overflow-hidden bg-[#FAFBFB]">
                        <CardHeader className="bg-[#f9fafb] border-b border-[#E1E3E5]">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-[#008060]" />
                                <div>
                                    <CardTitle className="text-lg font-semibold text-[#1a1c1d]">Infrastructure & Access</CardTitle>
                                    <CardDescription>Configure physical stores and user access restrictions.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 p-4 bg-white border border-[#E1E3E5] rounded-lg shadow-sm hover:border-[#008060] transition-colors group cursor-pointer" onClick={() => window.location.href = '/inventory/locations'}>
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-[#F1F8F5] rounded-lg text-[#008060]">
                                            <Building className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-[#1a1c1d] group-hover:text-[#008060]">Stores & Storage Locations</h4>
                                            <p className="text-sm text-[#6D7175] mt-1">Manage main stores, pharmacies, and ward inventories. Define the physical hierarchy of stock points.</p>
                                            <div className="mt-4 flex items-center text-xs font-bold text-[#008060] uppercase tracking-wider">
                                                Go to Stores CRUD
                                                <Globe className="ml-2 h-3 w-3" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 p-4 bg-white border border-[#E1E3E5] rounded-lg shadow-sm hover:border-[#008060] transition-colors group cursor-pointer" onClick={() => window.location.href = '/admin/users'}>
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-[#F1F8F5] rounded-lg text-[#008060]">
                                            <ShieldCheck className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-[#1a1c1d] group-hover:text-[#008060]">User Store Assignments</h4>
                                            <p className="text-sm text-[#6D7175] mt-1">Attach users to specific locations to restrict their access to local stocks and operations.</p>
                                            <div className="mt-4 flex items-center text-xs font-bold text-[#008060] uppercase tracking-wider">
                                                Manage Users
                                                <Save className="ml-2 h-3 w-3" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-4">
                        <Transition
                            show={recentlySuccessful}
                            enter="transition ease-in-out"
                            enterFrom="opacity-0"
                            leave="transition ease-in-out"
                            leaveTo="opacity-0"
                        >
                            <p className="text-sm text-[#008060] font-medium flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" />
                                Changes saved successfully
                            </p>
                        </Transition>

                        <Button 
                            type="submit" 
                            disabled={processing}
                            className="bg-[#008060] hover:bg-[#006e52] min-w-[120px]"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

SettingsIndex.layout = (page: React.ReactNode) => {
    // Assuming there is a common layout, but the example didn't show it 
    // In many Inertia setups, you wrap it in the page component.
    // However, looking at UsersIndex, it doesn't explicitly define .layout as a function return.
    // Wait, let's check how other pages define layout.
    return page;
}

// Actually, looking back at UsersIndex:
// UsersIndex.layout = {
//     breadcrumbs: [
//         { title: 'Administration', href: '/admin/users' },
//         { title: 'Users', href: '/admin/users' },
//     ],
// };
// This looks like a custom property used by a root layout.

// @ts-ignore
SettingsIndex.layout = {
    breadcrumbs: [
        { title: 'Administration', href: '/admin/users' },
        { title: 'System Settings', href: '/admin/settings' },
    ],
};
