interface StatsCardProps {
    title: string;
    value: string | number;
    change?: string;
    isPositive?: boolean;
}

export function StatsCard({ title, value, change, isPositive = true }: StatsCardProps) {
    return (
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-6 text-white h-full">
            <div className="text-white/80 text-xs sm:text-sm font-medium mb-1 sm:mb-2 truncate">
                {title}
            </div>
            <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 translate-y-[-2px]">
                {value}
            </div>
            {change && (
                <div className={`text-xs sm:text-sm font-medium ${isPositive ? 'text-white/90' : 'text-red-200'}`}>
                    {change}
                </div>
            )}
        </div>
    );
}
