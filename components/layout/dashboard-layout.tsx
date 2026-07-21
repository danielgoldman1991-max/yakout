"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth/actions";
import { company, dashboardNavGroups, type DashboardNavGroup } from "@/lib/constants/app";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Menu, X, LogOut } from "lucide-react";
import { YakoutLogo } from "@/components/branding/YakoutLogo";

function NavGroup({ group, pathname, onNav }: { group: DashboardNavGroup; pathname: string; onNav: () => void }) {
  const isActive = (href: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const active = group.items.some((item) => item.href && isActive(item.href));

  return (
    <div className="mb-5">
      <p className={cn("mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.15em]", active ? "text-gold/70" : "text-muted-foreground/50")}>
        {group.label}
      </p>
      <div className="space-y-0.5">
        {group.items.map((item) => {
          const activeItem = item.href && isActive(item.href);
          return (
            <div key={item.label}>
              {item.disabled ? (
                <div className="flex cursor-not-allowed items-center justify-between gap-2 rounded-sm px-3 py-2 text-sm text-muted-foreground/40">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                    {item.label}
                  </div>
                  {item.badge && <Badge tone="muted">{item.badge}</Badge>}
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={onNav}
                  className={cn(
                    "flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-all duration-200",
                    activeItem
                      ? "bg-gold/8 text-gold font-medium"
                      : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", activeItem ? "text-gold" : "text-muted-foreground/60")} />
                  {item.label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Mobile menu toggle ─── */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-card shadow-elevation-1 text-foreground transition hover:border-gold/30 hover:text-gold lg:hidden"
        aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* ─── Overlay mobile ─── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-border/60 bg-card shadow-elevation-2 transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-border/50 px-5 py-5">
            <Link href="/dashboard" className="flex flex-col items-start gap-2" onClick={closeMobile}>
              <YakoutLogo size="sm" priority />
              <div>
                <p className="text-[10px] text-muted-foreground/60 tracking-[0.12em] uppercase">Espace privé</p>
              </div>
            </Link>
          </div>

          {/* Navigation groupée */}
          <nav className="flex-1 overflow-y-auto px-3 py-5">
            {dashboardNavGroups.map((group) => (
              <NavGroup key={group.label} group={group} pathname={pathname} onNav={closeMobile} />
            ))}
          </nav>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <main className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/50 bg-background/90 px-5 shadow-sm backdrop-blur-md sm:px-8">
          <div className="pl-12 lg:pl-0">
            <h2 className="text-sm font-medium text-foreground">Espace équipe</h2>
            <p className="text-[10px] text-muted-foreground/60 tracking-[0.12em] uppercase">
              {company.city} &middot; {company.currency}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[10px] text-muted-foreground/40 tracking-[0.12em] uppercase sm:inline">
              {company.timezone}
            </span>
            <ThemeToggle />
            <form action={signOut}>
              <button
                type="submit"
                className="flex h-9 items-center gap-1.5 rounded-sm border border-border bg-surface/50 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-all duration-200 hover:border-gold/30 hover:text-gold hover:shadow-elevation-1"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <div className="px-5 py-6 sm:px-8 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
