"use client";

import * as React from "react";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Single control: cycles system → light → dark. Avoids wrong “active” state before hydration. */
export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const cycle = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-hidden disabled>
        <Sun className="h-[1.15rem] w-[1.15rem] opacity-40" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";
  const Icon = theme === "system" ? Monitor : isDark ? Moon : Sun;
  const label =
    theme === "system"
      ? "Theme: system (click for light)"
      : theme === "light"
        ? "Theme: light (click for dark)"
        : "Theme: dark (click for system)";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-9 w-9 shrink-0 border-border bg-background/80 hover:bg-secondary hover:text-secondary-foreground"
      aria-label={label}
      title={label}
      onClick={cycle}
    >
      <Icon className="h-[1.15rem] w-[1.15rem]" />
      <span className="sr-only">{label}</span>
    </Button>
  );
}
