import { useId } from "react";
import { Switch } from "./switch";
import { Label } from "./label";

interface ToggleProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, description, checked, onChange }: ToggleProps) {
  const id = useId();

  return (
    <div className="flex items-center gap-3">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
      />
      {(label || description) && (
        <div className="text-left">
          {label && (
            <Label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">
              {label}
            </Label>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
