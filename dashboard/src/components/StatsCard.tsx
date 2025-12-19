interface StatsCardProps {
    title: string;
    value: string | number;
    change?: string;
    isPositive?: boolean;
}

export function StatsCard({ title, value, change, isPositive = true }: StatsCardProps) {
    return (
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="text-white/80 text-sm font-medium mb-2">
                {title}
            </div>
            <div className="text-3xl font-bold mb-2">
                {value}
            </div>
            {change && (
                <div className={`text-sm font-medium ${isPositive ? 'text-white/90' : 'text-red-200'}`}>
                    {change}
                </div>
            )}
        </div>
    );
}
