import { NavLink } from "react-router";
import { LayoutDashboard, Package, Users, BarChart3, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/orders", icon: Package, label: "Orders" },
  { to: "/sellers", icon: Users, label: "Sellers" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen = false }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col bg-surface border-r border-border-subtle transition-all duration-300",
        // Mobile: slide in/out, always full width when open
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0",
        // Desktop: respect collapsed state. Mobile: always w-60 when open.
        "w-60",
        collapsed && "lg:w-16"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border-subtle">
        <span className="font-display font-bold text-accent text-xl tracking-tight">
          <span className={cn("hidden", collapsed && "lg:inline")}>JJ</span>
          <span className={cn(collapsed && "lg:hidden")}>JJSMade</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-accent-muted text-accent border-l-2 border-accent"
                  : "text-secondary hover:text-primary hover:bg-hover"
              )
            }
          >
            <Icon size={20} className="shrink-0" />
            {/* Always show on mobile; on desktop, hide when collapsed */}
            <span className={cn(collapsed && "lg:hidden")}>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Collapse button */}
      <button
        onClick={onToggle}
        className="hidden lg:flex items-center justify-center h-12 border-t border-border-subtle text-secondary hover:text-primary hover:bg-hover transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
