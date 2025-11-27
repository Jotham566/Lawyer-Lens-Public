"use client";

import Link from "next/link";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export function Logo({ collapsed = false, className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 font-semibold transition-opacity hover:opacity-80",
        className
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Scale className="h-4 w-4" />
      </div>
      {!collapsed && (
        <span className="text-lg tracking-tight">
          Lawyer<span className="text-primary">Lens</span>
        </span>
      )}
    </Link>
  );
}
