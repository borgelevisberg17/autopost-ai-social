import { Home, PenTool, Calendar, BarChart3, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: Calendar, label: "Agenda", href: "/history" },
  { icon: PenTool, label: "Criar", href: "/dashboard", isMain: true },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Settings, label: "Config", href: "/settings" },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          if (item.isMain) {
            return (
              <Link
                key={item.label}
                to={item.href}
                className="relative -mt-6"
              >
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
                  <item.icon className="w-6 h-6 text-primary-foreground" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
