import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "../../lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: number;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantClasses = {
  default: "border-primary/20 bg-gradient-to-br from-primary/5 to-orange-400/5",
  success: "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50",
  warning: "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50",
  danger: "border-red-200 bg-gradient-to-br from-red-50 to-rose-50",
};

const iconColorClasses = {
  default: "text-primary",
  success: "text-green-600",
  warning: "text-orange-600",
  danger: "text-red-600",
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "border-2 hover:shadow-lg transition-all duration-300 hover:scale-105 overflow-hidden group",
        variantClasses[variant]
      )}
    >
      <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn("p-2 rounded-lg bg-white/50 group-hover:bg-white transition-all", iconColorClasses[variant])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-1 group-hover:text-primary transition-colors">
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend !== undefined && (
          <div className={cn(
            "text-xs font-semibold mt-2",
            trend >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% from last period
          </div>
        )}
      </CardContent>
    </Card>
  );
}
