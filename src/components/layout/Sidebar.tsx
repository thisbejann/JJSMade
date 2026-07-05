import { NavLink } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  PackageIcon,
  UserGroupIcon,
  Contact01Icon,
  BarChartIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ShoppingBag01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "../../lib/utils";

// Utilities (Calculator, Settings) live in the TopBar; the sidebar holds
// only the pipeline destinations the operator moves between.
const NAV_ITEMS = [
  { to: "/", icon: DashboardSquare01Icon, label: "Dashboard" },
  { to: "/orders", icon: PackageIcon, label: "Orders" },
  { to: "/customers", icon: Contact01Icon, label: "Customers" },
  { to: "/sellers", icon: UserGroupIcon, label: "Sellers" },
  { to: "/analytics", icon: BarChartIcon, label: "Analytics" },
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
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-accent-muted text-accent"
                  : "text-secondary hover:text-primary hover:bg-hover"
              )
            }
          >
            <HugeiconsIcon icon={Icon} size={20} strokeWidth={1.5} className="shrink-0" />
            {/* Always show on mobile; on desktop, hide when collapsed */}
            <span className={cn(collapsed && "lg:hidden")}>{label}</span>
          </NavLink>
        ))}

        {/* Personal — visually separated within the nav area */}
        <div className="pt-3 mt-3 border-t border-border-subtle">
          <NavLink
            to="/personal"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-accent-muted text-accent"
                  : "text-secondary hover:text-primary hover:bg-hover"
              )
            }
          >
            <HugeiconsIcon icon={ShoppingBag01Icon} size={20} strokeWidth={1.5} className="shrink-0" />
            <span className={cn(collapsed && "lg:hidden")}>Personal</span>
          </NavLink>
        </div>
      </nav>

      {/* Collapse button */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden lg:flex items-center justify-center h-12 border-t border-border-subtle text-secondary hover:text-primary hover:bg-hover transition-colors"
      >
        {collapsed ? <HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={1.5} /> : <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={1.5} />}
      </button>
    </aside>
  );
}
