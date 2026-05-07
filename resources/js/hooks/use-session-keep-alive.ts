import { useEffect } from 'react';

/**
 * Hook to periodically ping the server to keep the session alive.
 * This prevents the "419 Page Expired" error caused by CSRF token timeout.
 * 
 * @param intervalMinutes Frequency of the heartbeat in minutes. Default is 5.
 */
export function useSessionKeepAlive(intervalMinutes = 5) {
    useEffect(() => {
        const intervalMs = intervalMinutes * 60 * 1000;

        const ping = async () => {
            try {
                // We use fetch directly to avoid Inertia's progress bar or interceptors
                await fetch('/up', { method: 'HEAD' });
            } catch (error) {
                console.warn('Session heartbeat failed:', error);
            }
        };

        const interval = setInterval(ping, intervalMs);

        // Also ping on initial mount
        ping();

        return () => clearInterval(interval);
    }, [intervalMinutes]);
}
