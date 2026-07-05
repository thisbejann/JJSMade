import { useNavigate } from "react-router";
import { DropdownMenu } from "radix-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, UserGroupIcon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { cn } from "../../lib/utils";

/**
 * Create control for the app TopBar, responsive in shape:
 *
 * - `sm+`: a split button in the header. The main area is the frequent action
 *   (Add Item, one tap → /orders/new); the divided chevron opens a menu with
 *   the full set.
 * - Below `sm`: a floating action button pinned to the lower right, inside
 *   thumb reach, with the menu opening upward from it. Reaching the top of the
 *   screen one-handed is the worst gesture a phone UI can ask for.
 *
 * "New Group Order" routes to the Quote Calculator, where a bundle is built
 * and negotiated before being promoted to a group, so each menu item carries
 * a one-line descriptor to make that destination unsurprising.
 *
 * Built on Radix DropdownMenu for keyboard nav, focus restore, Escape, and
 * click-outside without hand-rolling any of it.
 */
export function NewControl() {
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile: floating action button, menu opens upward from the thumb */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          aria-label="Create new"
          className="group fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-5 z-20 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-black/40 outline-none transition-colors hover:bg-accent-hover focus-visible:ring-3 focus-visible:ring-ring/40 data-[state=open]:bg-accent-hover sm:hidden"
        >
          <HugeiconsIcon
            icon={PlusSignIcon}
            size={24}
            strokeWidth={2}
            className="transition-transform duration-150 group-data-[state=open]:rotate-45"
          />
        </DropdownMenu.Trigger>
        <CreateMenu onNavigate={navigate} side="top" />
      </DropdownMenu.Root>

      {/* sm+: split button */}
      <div className="hidden h-9 shrink-0 items-stretch rounded-4xl bg-accent text-sm font-medium text-accent-foreground sm:inline-flex">
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
          <CreateMenu onNavigate={navigate} />
        </DropdownMenu.Root>
      </div>
    </>
  );
}

function CreateMenu({
  onNavigate,
  side = "bottom",
}: {
  onNavigate: (to: string) => void;
  side?: "top" | "bottom";
}) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        side={side}
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className={cn(
          // Fixed width so hints size the panel, not stretch it: on mobile an
          // unconstrained panel hits the screen edge and reads as a broken sheet.
          // Solid Elevated Void per the design system; popovers earn depth from
          // surface color, not blur.
          "dark z-50 w-72 origin-(--radix-dropdown-menu-content-transform-origin) rounded-3xl bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/10",
          "duration-100 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
        )}
      >
        <MenuItem
          icon={PlusSignIcon}
          label="Add Item"
          hint="A single order for one customer"
          onSelect={() => onNavigate("/orders/new")}
        />
        <MenuItem
          icon={UserGroupIcon}
          label="New Group Order"
          hint="Build a bundle in the calculator"
          onSelect={() => onNavigate("/calculator")}
        />
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
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
