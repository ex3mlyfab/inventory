import AuthLayoutTemplate from '@/layouts/auth/auth-split-layout';
import { useSessionKeepAlive } from '@/hooks/use-session-keep-alive';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    useSessionKeepAlive();

    return (
        <AuthLayoutTemplate title={title} description={description}>
            {children}
        </AuthLayoutTemplate>
    );
}
