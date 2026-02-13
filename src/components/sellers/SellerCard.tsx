import { useNavigate } from "react-router";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { formatPHP } from "../../lib/formatters";
import { PLATFORM_CONFIG } from "../../lib/constants";
import { Edit, Trash2 } from "lucide-react";

interface SellerCardProps {
  seller: {
    _id: string;
    name: string;
    platform?: string;
    contactInfo?: string;
    storeLink?: string;
    totalItems: number;
    soldItems: number;
    totalProfit: number;
    avgProfit: number;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function SellerCard({ seller, onEdit, onDelete }: SellerCardProps) {
  const navigate = useNavigate();

  return (
    <Card hover className="p-4 space-y-3" onClick={() => navigate(`/sellers/${seller._id}`)}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display font-semibold text-primary">{seller.name}</h3>
          {seller.platform && (
            <Badge variant="default" className="mt-1">
              {PLATFORM_CONFIG[seller.platform as keyof typeof PLATFORM_CONFIG]?.label ?? seller.platform}
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors cursor-pointer">
            <Edit size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg text-secondary hover:text-danger hover:bg-danger-muted transition-colors cursor-pointer">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {seller.contactInfo && (
        <p className="text-xs text-secondary truncate">{seller.contactInfo}</p>
      )}

      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-subtle">
        <div>
          <p className="text-xs text-tertiary">Items</p>
          <p className="font-mono text-sm text-primary">{seller.totalItems}</p>
        </div>
        <div>
          <p className="text-xs text-tertiary">Sold</p>
          <p className="font-mono text-sm text-primary">{seller.soldItems}</p>
        </div>
        <div>
          <p className="text-xs text-tertiary">Total Profit</p>
          <p className="font-mono text-sm text-success">{formatPHP(seller.totalProfit)}</p>
        </div>
        <div>
          <p className="text-xs text-tertiary">Avg Profit</p>
          <p className="font-mono text-sm text-primary">{formatPHP(seller.avgProfit)}</p>
        </div>
      </div>
    </Card>
  );
}
