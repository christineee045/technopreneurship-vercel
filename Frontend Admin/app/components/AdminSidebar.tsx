import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  BarChart3,
  Users,
  Package,
  AlertCircle,
  Flag,
  TrendingUp,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  List,
  Calendar,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./ui/button";

const navItems = [
  {
    label: "Overview",
    icon: BarChart3,
    path: "/admin",
  },
  {
    label: "Users",
    icon: Users,
    path: "/admin/users",
  },
  {
    label: "Listings",
    icon: Package,
    path: "/admin/listings",
  },
  {
    label: "Reviews",
    icon: MessageSquare,
    path: "/admin/reviews",
  },
  {
    label: "Requests",
    icon: List,
    path: "/admin/requests",
  },
  {
    label: "Overdue Items",
    icon: AlertCircle,
    path: "/admin/overdue",
  },
  {
    label: "Disputes",
    icon: Flag,
    path: "/admin/disputes",
  },
  {
    label: "Analytics",
    icon: TrendingUp,
    path: "/admin/analytics",
  },
];

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const width = isCollapsed ? "5rem" : "20rem";
    document.documentElement.style.setProperty("--admin-sidebar-width", width);
    return () => {
      document.documentElement.style.removeProperty("--admin-sidebar-width");
    };
  }, [isCollapsed]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen pt-16 bg-gradient-to-b from-muted/30 to-muted/10 border-r transition-all duration-300 z-40 w-[var(--admin-sidebar-width)]",
        className
      )}
    >
      {/* Collapse Button */}
      <div className="flex items-center justify-end p-2 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hover:bg-primary/10 transition-all"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="space-y-1 p-3 overflow-y-auto h-[calc(100%-4rem)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "hover:bg-primary/10 hover:text-primary",
                isActive
                  ? "bg-gradient-to-r from-primary/20 to-orange-400/20 text-primary border-l-2 border-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "animate-pulse")} />
              {!isCollapsed && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info - Only show when expanded */}
      {!isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gradient-to-t from-primary/5 to-transparent">
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Lendly</p>
            <p>Building stronger communities through sharing.</p>
          </div>
        </div>
      )}
    </aside>
  );
}
