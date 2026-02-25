import { useLocation, useNavigate } from "react-router";
import { Plus, Menu, LogOut } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/orders": "Orders",
  "/orders/new": "New Order",
  "/sellers": "Sellers",
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

  if (location.pathname.match(/^\/orders\/[^/]+\/edit$/)) title = "Edit Order";
  else if (location.pathname.match(/^\/orders\/[^/]+$/)) title = "Order Details";
  else if (location.pathname.match(/^\/sellers\/[^/]+$/)) title = "Seller Details";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 sm:px-6 bg-surface/80 backdrop-blur-md border-b border-border-subtle">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 -ml-2 text-secondary hover:text-primary hover:bg-hover rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display font-bold text-xl text-primary">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={() => navigate("/orders/new")} size="sm">
          <Plus size={16} />
          New Item
        </Button>
        <button
          onClick={() => { logout(); navigate("/login", { replace: true }); }}
          className="p-2 text-secondary hover:text-primary hover:bg-hover rounded-lg transition-colors"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
