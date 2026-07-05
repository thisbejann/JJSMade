import { NavLink, useLocation, useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Menu01Icon,
  Logout01Icon,
  Calculator01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "../ui/Button";
import { NewControl } from "../items/NewControl";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/orders": "Orders",
  "/orders/new": "New Order",
  "/customers": "Customers",
  "/personal": "Personal Items",
  "/personal/new": "New Personal Item",
  "/sellers": "Sellers",
  "/calculator": "Quote Calculator",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

// Utilities that graduated out of the sidebar: tools you dip into, not
// destinations you live in. Route-aware so the active one reads coral.
const UTILITY_LINKS = [
  { to: "/calculator", icon: Calculator01Icon, label: "Quote Calculator" },
  { to: "/settings", icon: Settings01Icon, label: "Settings" },
];

interface TopBarProps {
  onMobileMenuToggle?: () => void;
}

export function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  let title = PAGE_TITLES[location.pathname] ?? "JJSMade";
  const isPersonalRoute = location.pathname.startsWith("/personal");
  // No create CTA on the create/edit forms themselves
  const isFormRoute = /\/(new|edit)$/.test(location.pathname);

  if (location.pathname.match(/^\/orders\/[^/]+\/edit$/)) title = "Edit Order";
  else if (location.pathname.match(/^\/orders\/[^/]+$/)) title = "Order Details";
  else if (location.pathname.match(/^\/customers\/[^/]+$/)) title = "Customer Details";
  else if (location.pathname.match(/^\/sellers\/[^/]+$/)) title = "Seller Details";
  else if (location.pathname.match(/^\/personal\/[^/]+\/edit$/)) title = "Edit Personal Item";
  else if (location.pathname.match(/^\/personal\/[^/]+$/)) title = "Personal Item Details";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 sm:px-6 bg-surface border-b border-border-subtle">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMobileMenuToggle}
          aria-label="Toggle menu"
          className="lg:hidden p-2 -ml-2 text-secondary hover:text-primary hover:bg-hover rounded-lg transition-colors"
        >
          <HugeiconsIcon icon={Menu01Icon} size={20} strokeWidth={1.5} />
        </button>
        <h1 className="font-display font-bold text-xl text-primary truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-1">
        {!isFormRoute &&
          (isPersonalRoute ? (
            <>
              <Button
                onClick={() => navigate("/personal/new")}
                size="sm"
                className="hidden sm:inline-flex"
              >
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
                New Item
              </Button>
              {/* Mobile: same FAB placement as NewControl, minus the menu */}
              <button
                onClick={() => navigate("/personal/new")}
                aria-label="New personal item"
                className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-5 z-20 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-black/40 transition-colors hover:bg-accent-hover sm:hidden"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={24} strokeWidth={2} />
              </button>
            </>
          ) : (
            <NewControl />
          ))}

        {/* Create action lives in a FAB on mobile, so the divider only
            separates things on sm+ (and only when the create control shows) */}
        {!isFormRoute && <div className="mx-2 hidden h-5 w-px bg-border-default sm:block" aria-hidden />}

        {UTILITY_LINKS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            title={label}
            className={({ isActive }) =>
              cn(
                "p-2 rounded-lg transition-colors",
                isActive
                  ? "bg-accent-muted text-accent"
                  : "text-secondary hover:text-primary hover:bg-hover"
              )
            }
          >
            <HugeiconsIcon icon={icon} size={18} strokeWidth={1.5} />
          </NavLink>
        ))}

        <button
          onClick={() => { logout(); navigate("/login", { replace: true }); }}
          className="p-2 text-secondary hover:text-primary hover:bg-hover rounded-lg transition-colors"
          aria-label="Sign out"
          title="Sign out"
        >
          <HugeiconsIcon icon={Logout01Icon} size={18} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
