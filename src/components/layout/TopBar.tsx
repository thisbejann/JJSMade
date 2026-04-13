import { useLocation, useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Menu01Icon, Logout01Icon } from "@hugeicons/core-free-icons";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/orders": "Orders",
  "/orders/new": "New Order",
  "/personal": "Personal Items",
  "/personal/new": "New Personal Item",
  "/sellers": "Sellers",
  "/calculator": "Quote Calculator",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

interface TopBarProps {
  onMobileMenuToggle?: () => void;
}

export function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  let title = PAGE_TITLES[location.pathname] ?? "JJSMade";
  const isPersonalRoute = location.pathname.startsWith("/personal");

  if (location.pathname.match(/^\/orders\/[^/]+\/edit$/)) title = "Edit Order";
  else if (location.pathname.match(/^\/orders\/[^/]+$/)) title = "Order Details";
  else if (location.pathname.match(/^\/sellers\/[^/]+$/)) title = "Seller Details";
  else if (location.pathname.match(/^\/personal\/[^/]+\/edit$/)) title = "Edit Personal Item";
  else if (location.pathname.match(/^\/personal\/[^/]+$/)) title = "Personal Item Details";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 sm:px-6 bg-surface border-b border-border-subtle">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          aria-label="Toggle menu"
          className="lg:hidden p-2 -ml-2 text-secondary hover:text-primary hover:bg-hover rounded-lg transition-colors"
        >
          <HugeiconsIcon icon={Menu01Icon} size={20} strokeWidth={1.5} />
        </button>
        <h1 className="font-display font-bold text-xl text-primary">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={() => navigate(isPersonalRoute ? "/personal/new" : "/orders/new")} size="sm">
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
          New Item
        </Button>
        <button
          onClick={() => { logout(); navigate("/login", { replace: true }); }}
          className="p-2 text-secondary hover:text-primary hover:bg-hover rounded-lg transition-colors"
          aria-label="Sign out"
        >
          <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
