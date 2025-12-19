import { Group } from '@/lib/api';

interface StatusBadgeProps {
    group: Group;
}

export function StatusBadge({ group }: StatusBadgeProps) {
    if (group.isBlocked) {
        return (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                Blocked
            </span>
        );
    }

    if (group.isActive) {
        return (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                Active
            </span>
        );
    }

    return (
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-400/10 dark:bg-slate-500/10 text-gray-500 dark:text-slate-400 border border-gray-300 dark:border-slate-600">
            Inactive
        </span>
    );
}
