import React from 'react';

interface StatisticCardProps {
    label: string;
    value: string | number;
    valueColor?: string; // Optional custom color for the value
}

/**
 * A standardized statistic card component.
 * 
 * Design Specs:
 * - Padding: 24px (1.5rem / p-6)
 * - Radius: 16px (1rem / rounded-2xl)
 * - Min-Width: 140px (min-w-[140px])
 * - Border: 1px solid (gray-400 / dark:slate-600)
 * - Background: White (opaque) / Dark Slate (50% opacity)
 * - Shadow: None
 */
export function StatisticCard({ label, value, valueColor = "text-blue-500" }: StatisticCardProps) {
    return (
        <div className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-6 min-w-0 sm:min-w-[140px] rounded-2xl border border-gray-400 dark:border-slate-600 bg-white dark:bg-slate-800/50">
            <div className={`text-3xl font-bold mb-1 ${valueColor}`}>
                {value}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium text-center">
                {label}
            </div>
        </div>
    );
}
