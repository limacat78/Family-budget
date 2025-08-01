import { formatCurrency, formatPercentage } from "@/utils/formatters";

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  iconColor: "green" | "red" | "blue" | "yellow" | "purple";
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  trendText?: string;
  progressBar?: {
    current: number;
    target: number;
    label: string;
  };
}

const StatCard = ({ 
  title, 
  value, 
  icon, 
  iconColor, 
  trend, 
  trendText,
  progressBar 
}: StatCardProps) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case "green": return { bg: "bg-green-100", text: "text-green-500" };
      case "red": return { bg: "bg-red-100", text: "text-red-500" };
      case "blue": return { bg: "bg-blue-100", text: "text-primary" };
      case "yellow": return { bg: "bg-yellow-100", text: "text-accent" };
      case "purple": return { bg: "bg-purple-100", text: "text-purple-500" };
      default: return { bg: "bg-gray-100", text: "text-gray-500" };
    }
  };

  const colorClasses = getColorClasses(iconColor);
  const trendColorClass = trend?.direction === "up" ? "text-green-600" : "text-red-600";
  
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-2xl font-semibold mt-1">{formatCurrency(value)}</h3>
        </div>
        <span className={`material-icons ${colorClasses.text} ${colorClasses.bg} p-2 rounded-full`}>
          {icon}
        </span>
      </div>
      
      {trend && (
        <div className={`mt-3 text-sm ${trendColorClass} flex items-center`}>
          <span className="material-icons text-sm mr-1">
            {trend.direction === "up" ? "trending_up" : "trending_down"}
          </span>
          <span>{formatPercentage(trend.value)}</span> {trendText}
        </div>
      )}
      
      {progressBar && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-accent h-2.5 rounded-full" 
              style={{ width: `${Math.min(Math.round((progressBar.current / progressBar.target) * 100), 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{progressBar.label}</p>
        </div>
      )}
    </div>
  );
};

export default StatCard;
