import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/page-header';
import { Combobox } from '@/components/ui/combobox';
import type { Department, Role } from '@/types/auth';
import { ArrowLeft } from 'lucide-react';

interface Props {
    roles: Role[];
    departments: Department[];
}

export default function CreateUser({ roles, departments }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
        department_id: '',
        employee_id: '',
        phone: '',
        is_active: true,
        roles: [] as string[],
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/users');
    }

    function toggleRole(roleName: string) {
        setData('roles', data.roles.includes(roleName)
            ? data.roles.filter((r) => r !== roleName)
            : [...data.roles, roleName],
        );
    }

    return (
        <>
            <Head title="Create User" />
            <div className="mx-auto max-w-2xl space-y-5 p-5">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild className="text-[#008060] hover:bg-[#e0f4eb] hover:text-[#006e3c]">
                        <Link href="/admin/users">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                    <PageHeader
                        title="Create User"
                        description="Add a new user to the system."
                    />
                </div>

                {/* Polaris Card Form */}
                <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-[#E1E3E5] bg-white p-6">
                    {/* Section: Basic Info */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-[#181d1a]">Personal Information</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-xs font-medium text-[#202223]">Full Name *</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="border-[#babfc3] focus-visible:ring-[#008060]" />
                                {errors.name && <p className="text-xs text-[#D82C0D]">{errors.name}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="username" className="text-xs font-medium text-[#202223]">Username *</Label>
                                <Input id="username" value={data.username} onChange={(e) => setData('username', e.target.value)} className="border-[#babfc3] focus-visible:ring-[#008060]" />
                                {errors.username && <p className="text-xs text-[#D82C0D]">{errors.username}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-medium text-[#202223]">Email Address *</Label>
                                <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="border-[#babfc3] focus-visible:ring-[#008060]" />
                                {errors.email && <p className="text-xs text-[#D82C0D]">{errors.email}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="employee_id" className="text-xs font-medium text-[#202223]">Employee ID</Label>
                                <Input id="employee_id" value={data.employee_id} onChange={(e) => setData('employee_id', e.target.value)} placeholder="FMC-XXX-001" className="border-[#babfc3] focus-visible:ring-[#008060]" />
                                {errors.employee_id && <p className="text-xs text-[#D82C0D]">{errors.employee_id}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="phone" className="text-xs font-medium text-[#202223]">Phone Number</Label>
                                <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="border-[#babfc3] focus-visible:ring-[#008060]" />
                                {errors.phone && <p className="text-xs text-[#D82C0D]">{errors.phone}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-[#E1E3E5]" />

                    {/* Section: Department */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-[#181d1a]">Department Assignment</h3>
                        <div className="space-y-1.5">
                            <Label htmlFor="department_id" className="text-xs font-medium text-[#202223]">Department</Label>
                            <Combobox
                                options={departments.map((dept) => ({
                                    label: dept.name,
                                    value: String(dept.id),
                                }))}
                                value={data.department_id}
                                onChange={(value) => setData('department_id', value)}
                                placeholder="Search and select a department"
                                emptyMessage="No department found."
                            />
                            {errors.department_id && <p className="text-xs text-[#D82C0D]">{errors.department_id}</p>}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#E1E3E5]" />

                    {/* Section: Password */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-[#181d1a]">Security</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-xs font-medium text-[#202223]">Password *</Label>
                                <Input id="password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className="border-[#babfc3] focus-visible:ring-[#008060]" />
                                {errors.password && <p className="text-xs text-[#D82C0D]">{errors.password}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="password_confirmation" className="text-xs font-medium text-[#202223]">Confirm Password *</Label>
                                <Input id="password_confirmation" type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} className="border-[#babfc3] focus-visible:ring-[#008060]" />
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#E1E3E5]" />

                    {/* Section: Roles */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-[#181d1a]">Access Roles</h3>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {roles.map((role) => (
                                <label
                                    key={role.id}
                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                                        data.roles.includes(role.name)
                                            ? 'border-[#008060] bg-[#e0f4eb]'
                                            : 'border-[#E1E3E5] hover:bg-[#f6fbf6]'
                                    }`}
                                >
                                    <Checkbox
                                        checked={data.roles.includes(role.name)}
                                        onCheckedChange={() => toggleRole(role.name)}
                                    />
                                    <span className="text-sm font-medium text-[#181d1a]">{role.name}</span>
                                </label>
                            ))}
                        </div>
                        {errors.roles && <p className="mt-1 text-xs text-[#D82C0D]">{errors.roles}</p>}
                    </div>

                    {/* Active Toggle */}
                    <label className="flex items-center gap-2">
                        <Checkbox
                            checked={data.is_active}
                            onCheckedChange={(v) => setData('is_active', v === true)}
                        />
                        <span className="text-sm text-[#181d1a]">Account is active</span>
                    </label>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 border-t border-[#E1E3E5] pt-4">
                        <Button variant="outline" asChild className="border-[#babfc3]">
                            <Link href="/admin/users">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-[#008060] hover:bg-[#006e52]">
                            {processing ? 'Creating...' : 'Create User'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateUser.layout = {
    breadcrumbs: [
        { title: 'Administration', href: '/admin/users' },
        { title: 'Users', href: '/admin/users' },
        { title: 'Create', href: '/admin/users/create' },
    ],
};
