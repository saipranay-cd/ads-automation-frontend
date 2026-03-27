"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  BarChart3,
  Megaphone,
  Layers,
  FileText,
  Users,
  Sparkles,
  PlusCircle,
  Settings,
  Zap,
  LogOut,
  LogIn,
  MessageCircle,
  Target,
  Compass,
  GitCommitVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "MANAGE",
    items: [
      { label: "Campaigns", href: "/campaigns", icon: Megaphone },
      { label: "Ad Sets", href: "/ad-sets", icon: Layers },
      { label: "Ads", href: "/ads", icon: FileText },
      { label: "Audiences", href: "/audiences", icon: Users },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { label: "Insights", href: "/insights", icon: Sparkles },
      { label: "Lead Quality", href: "/lead-quality", icon: Target },
      { label: "Funnel", href: "/funnel", icon: GitCommitVertical },
      { label: "Creatives", href: "/creatives", icon: FileText },
      { label: "AI Chat", href: "/chat", icon: MessageCircle },
      // { label: "Automation", href: "/automation", icon: Zap },
      { label: "Create Ad", href: "/create", icon: PlusCircle },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { label: "Onboarding", href: "/onboarding", icon: Compass },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex h-screen w-[220px] flex-col border-r"
        style={{
          background: "var(--bg-base)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{
              background: "var(--acc)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <Zap size={14} color="white" />
          </div>
          <div className="flex flex-col">
            <span
              className="text-sm font-semibold leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Adsflow
            </span>
            <span
              className="font-mono text-[10px] leading-tight"
              style={{ color: "var(--text-tertiary)" }}
            >
              Meta Ads Platform
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2">
          {navSections.map((section) => (
            <div key={section.label} className="mb-4">
              <span
                className="mb-1 block px-2.5 text-[10px] font-medium uppercase tracking-[0.06em]"
                style={{ color: "var(--text-tertiary)" }}
              >
                {section.label}
              </span>
              {section.items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                      isActive ? "font-medium" : "",
                    )}
                    style={{
                      background: isActive
                        ? "var(--acc-subtle)"
                        : "transparent",
                      color: isActive
                        ? "var(--acc-text)"
                        : "var(--text-secondary)",
                    }}
                  >
                    <Icon size={15} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User row */}
        <div
          className="flex items-center justify-between border-t px-4 py-3"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {user ? (
            <>
              <div className="flex items-center gap-2.5">
                {user.image ? (
                  <img
                    src={user.image}
                    alt=""
                    className="h-7 w-7 rounded-full"
                  />
                ) : (
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium"
                    style={{
                      background: "var(--acc-subtle)",
                      color: "var(--acc-text)",
                    }}
                  >
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="flex flex-col">
                  <span
                    className="max-w-[100px] truncate text-xs font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {user.name || "User"}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Connected
                  </span>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-subtle)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                title="Disconnect"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex w-full items-center gap-2.5 rounded-md px-1 py-1 text-xs font-medium transition-colors"
              style={{ color: "var(--acc-text)" }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  background: "var(--acc-subtle)",
                  color: "var(--acc-text)",
                }}
              >
                <LogIn size={13} />
              </div>
              Connect Meta
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t py-2 md:hidden"
        style={{
          background: "var(--bg-base)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {[
          { label: "Home", href: "/", icon: LayoutDashboard },
          { label: "Campaigns", href: "/campaigns", icon: Megaphone },
          { label: "Insights", href: "/insights", icon: Sparkles },
          { label: "Quality", href: "/lead-quality", icon: Target },
          { label: "Settings", href: "/settings", icon: Settings },
        ].map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
            >
              <Icon
                size={20}
                style={{
                  color: isActive ? "var(--acc-text)" : "var(--text-tertiary)",
                }}
              />
              <span
                className="text-[10px] font-medium"
                style={{
                  color: isActive ? "var(--acc-text)" : "var(--text-tertiary)",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
