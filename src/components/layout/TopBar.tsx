import { useLocation, useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { Button } from "../ui/Button";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/orders": "Orders",
  "/orders/new": "New Order",
  "/sellers": "Sellers",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();

  let title = PAGE_TITLES[location.pathname] ?? "JJSMade";

  if (location.pathname.match(/^\/orders\/[^/]+\/edit$/)) title = "Edit Order";
  else if (location.pathname.match(/^\/orders\/[^/]+$/)) title = "Order Details";
  else if (location.pathname.match(/^\/sellers\/[^/]+$/)) title = "Seller Details";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-surface/80 backdrop-blur-md border-b border-border-subtle">
      <h1 className="font-display font-bold text-xl text-primary">{title}</h1>
      <div className="flex items-center gap-3">
        <Button onClick={() => navigate("/orders/new")} size="sm">
          <Plus size={16} />
          New Item
        </Button>
      </div>
    </header>
  );
}
