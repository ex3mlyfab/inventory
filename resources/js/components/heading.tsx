export default function Heading({
    title,
    description,
    variant = 'default',
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
}) {
    return (
        <header className={variant === 'small' ? '' : 'mb-8 space-y-0.5'}>
            <h2
                className={
                    variant === 'small'
                        ? 'mb-0.5 text-base font-semibold text-[#181d1a]'
                        : 'text-xl font-semibold tracking-tight text-[#181d1a]'
                }
            >
                {title}
            </h2>
            {description && (
                <p className="text-sm text-[#6D7175]">{description}</p>
            )}
        </header>
    );
}
