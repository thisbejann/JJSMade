import { useNavigate } from "react-router";
import { DropdownMenu } from "radix-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, UserGroupIcon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { cn } from "../../lib/utils";

/**
 * Split button for the Orders header. The main area is the frequent action
 * (Add Item, one tap → /orders/new); the divided chevron opens a menu with the
 * full set. "New Group Order" routes to the Quote Calculator, where a bundle is
 * built and negotiated before being promoted to a group, so each menu item
 * carries a one-line descriptor to make that destination unsurprising.
 *
 * Built on Radix DropdownMenu for keyboard nav, focus restore, Escape, and
 * click-outside without hand-rolling any of it.
 */
export function NewControl() {
  const navigate = useNavigate();

  return (
    <div className="inline-flex h-8 shrink-0 items-stretch rounded-4xl bg-accent text-sm font-medium text-accent-foreground">
      <button
        type="button"
        onClick={() => navigate("/orders/new")}
        className="inline-flex items-center gap-1.5 rounded-l-4xl pl-3 pr-2.5 outline-none transition-colors hover:bg-accent-foreground/15 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-inset"
      >
        <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={2} />
        Add Item
      </button>

      <div className="my-1.5 w-px bg-accent-foreground/25" aria-hidden />

      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          aria-label="More create options"
          className="group inline-flex items-center rounded-r-4xl px-1.5 outline-none transition-colors hover:bg-accent-foreground/15 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-inset data-[state=open]:bg-accent-foreground/15"
        >
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={14}
            strokeWidth={2}
            className="transition-transform duration-150 group-data-[state=open]:rotate-180"
          />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className={cn(
              "dark relative z-50 min-w-60 origin-(--radix-dropdown-menu-content-transform-origin) rounded-3xl p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/10",
              "bg-popover/70 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150",
              "duration-100 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2"
            )}
          >
            <MenuItem
              icon={PlusSignIcon}
              label="Add Item"
              hint="A single order for one customer"
              onSelect={() => navigate("/orders/new")}
            />
            <MenuItem
              icon={UserGroupIcon}
              label="New Group Order"
              hint="Build & negotiate a bundle in the calculator"
              onSelect={() => navigate("/calculator")}
            />
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  hint,
  onSelect,
}: {
  icon: typeof PlusSignIcon;
  label: string;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-2 outline-hidden select-none transition-colors data-[highlighted]:bg-foreground/10"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
        <HugeiconsIcon icon={icon} size={16} strokeWidth={1.5} />
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
    </DropdownMenu.Item>
  );
}
