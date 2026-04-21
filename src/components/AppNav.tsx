"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Target,
  Telescope,
  KanbanSquare,
  XCircle,
  Settings,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Target },
  { href: "/discovery", label: "Discovery", icon: Telescope },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/eliminated", label: "Eliminated", icon: XCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppNav({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav className="border-b bg-background sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-primary text-lg">
            PV Leads
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  pathname === href || pathname.startsWith(href + "/")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              <UserIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
