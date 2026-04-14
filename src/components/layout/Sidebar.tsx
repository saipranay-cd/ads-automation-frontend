"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@/hooks/use-logout";
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
  FolderOpen,
  KeyRound,
  HelpCircle,
  Search,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlatform } from "@/hooks/use-platform";
import { useCanEdit } from "@/hooks/use-role";
import { PlatformSwitcher } from "@/components/layout/PlatformSwitcher";
import { OrgSwitcher } from "@/components/layout/OrgSwitcher";

const metaManageItems = [
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Ad Sets", href: "/ad-sets", icon: Layers },
  { label: "Ads", href: "/ads", icon: FileText },
  { label: "Audiences", href: "/audiences", icon: Users },
];

const googleManageItems = [
  { label: "Campaigns", href: "/google/campaigns", icon: Megaphone },
  { label: "Ad Groups", href: "/google/ad-groups", icon: FolderOpen },
  { label: "Ads", href: "/google/ads", icon: FileText },
  { label: "Keywords", href: "/google/keywords", icon: KeyRound },
];

function getNavSections(platform: "meta" | "google") {
  return [
    {
      label: "OVERVIEW",
      items: [
        { label: "Dashboard", href: "/", icon: LayoutDashboard },
        { label: "Analytics", href: "/analytics", icon: BarChart3 },
      ],
    },
    {
      label: "MANAGE",
      items: platform === "google" ? googleManageItems : metaManageItems,
    },
    {
      label: "INTELLIGENCE",
      items: platform === "google"
        ? [
            { label: "Insights", href: "/insights", icon: Sparkles },
            { label: "Knowledge Base", href: "/google/knowledge-base", icon: BookOpen },
            { label: "Lead Quality", href: "/google/lead-quality", icon: Target },
            { label: "Funnel", href: "/google/funnel", icon: GitCommitVertical },
            { label: "AI Chat", href: "/chat", icon: MessageCircle },
            { label: "Create Campaign", href: "/google/create", icon: PlusCircle },
          ]
        : [
            { label: "Insights", href: "/insights", icon: Sparkles },
            { label: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
            { label: "Lead Quality", href: "/lead-quality", icon: Target },
            { label: "Funnel", href: "/funnel", icon: GitCommitVertical },
            { label: "Creatives", href: "/creatives", icon: FileText },
            { label: "AI Chat", href: "/chat", icon: MessageCircle },
            { label: "Create Campaign", href: "/create", icon: PlusCircle },
          ],
    },
    {
      label: "SYSTEM",
      items: [
        { label: "Team", href: "/team", icon: Users },
        { label: "Settings", href: "/settings", icon: Settings },
      ],
    },
  ];
}

export function Sidebar() {
  const pathname = usePathname();
  const { user: authUser, isAuthenticated } = useAuth();
  const logout = useLogout();
  const { platform } = usePlatform();
  const canEdit = useCanEdit();
  const navSections = getNavSections(platform);

  return (
    <aside
      role="navigation"
      aria-label="Main navigation"
      className={cn(
        // Hidden on mobile (<640px), shown on tablet+
        "hidden h-screen flex-col border-r",
        // Tablet (sm to lg): collapsed 56px icon-only sidebar
        "sm:flex sm:w-[56px]",
        // Desktop (lg+): full 220px sidebar
        "lg:w-[220px]",
        // Hover expand on tablet with group selector
        "group/sidebar sm:hover:w-[220px] lg:hover:w-[220px]",
        "sm:transition-[width] sm:duration-200 sm:ease-out"
      )}
      style={{
        background: "var(--bg-base)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 sm:justify-center sm:px-2 lg:justify-start lg:px-4">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{
            background: "var(--acc)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <Zap size={14} color="white" />
        </div>
        <div className="hidden flex-col group-hover/sidebar:sm:flex lg:flex">
          <span
            className="whitespace-nowrap text-sm font-semibold leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Adsflow
          </span>
          <span
            className="whitespace-nowrap font-mono text-[10px] leading-tight"
            style={{ color: "var(--text-tertiary)" }}
          >
            Ads Platform
          </span>
        </div>
      </div>

      {/* Org Switcher */}
      <OrgSwitcher />

      {/* Platform Switcher */}
      <div className="px-2.5 pb-2">
        <PlatformSwitcher />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-1.5 py-1 sm:px-1 lg:px-2.5">
        {navSections.map((section, sIdx) => (
          <div key={section.label} className="mb-2">
            {sIdx > 0 && (
              <div
                className="mx-2.5 mb-2 mt-1 hidden group-hover/sidebar:sm:block lg:block"
                style={{ borderTop: "1px solid var(--border-subtle)" }}
              />
            )}
            <span
              className="mb-1 hidden whitespace-nowrap px-2.5 text-[10px] font-medium uppercase tracking-[0.06em] group-hover/sidebar:sm:block lg:block"
              style={{ color: "var(--text-tertiary)" }}
            >
              {section.label}
            </span>
            {section.items.filter((item) => {
              // Hide "Create Campaign" for read-only users
              if (!canEdit && (item.href === "/create" || item.href === "/google/create")) return false;
              return true;
            }).map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group/nav-item relative flex items-center rounded-md text-[13px] transition-colors",
                    // Tablet collapsed: centered icon
                    "sm:justify-center sm:px-0 sm:py-1.5",
                    // Tablet hover expanded / Desktop: normal layout
                    "group-hover/sidebar:sm:justify-start group-hover/sidebar:sm:gap-2.5 group-hover/sidebar:sm:px-2.5 group-hover/sidebar:sm:py-[6px]",
                    "lg:justify-start lg:gap-2.5 lg:px-2.5 lg:py-[6px]",
                    isActive ? "font-medium" : "",
                  )}
                  style={{
                    background: isActive ? "var(--acc-subtle)" : "transparent",
                    color: isActive
                      ? "var(--acc-text)"
                      : "var(--text-secondary)",
                  }}
                >
                  <Icon size={16} className="shrink-0" aria-hidden="true" />
                  {/* Label: hidden in collapsed tablet, visible on hover and desktop */}
                  <span className="hidden whitespace-nowrap group-hover/sidebar:sm:inline lg:inline">
                    {item.label}
                  </span>
                  {/* Tooltip for collapsed tablet state (hidden when sidebar is expanded or on desktop) */}
                  <span
                    className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium opacity-0 transition-opacity sm:block sm:group-hover/nav-item:opacity-100 lg:!hidden group-hover/sidebar:!hidden"
                    style={{
                      background: "var(--bg-raised)",
                      color: "var(--text-primary)",
                      boxShadow: "var(--shadow-float)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Search trigger */}
      <div className="px-2.5 pb-1 sm:px-1 lg:px-2.5">
        <button
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
          }}
          className="flex w-full items-center rounded-md text-[11px] font-medium transition-colors sm:justify-center sm:px-0 sm:py-2 group-hover/sidebar:sm:justify-start group-hover/sidebar:sm:gap-2.5 group-hover/sidebar:sm:px-2.5 group-hover/sidebar:sm:py-1.5 lg:justify-start lg:gap-2.5 lg:px-2.5 lg:py-1.5"
          style={{ color: "var(--text-tertiary)", background: "var(--bg-subtle)", border: "1px solid var(--border-default)" }}
          title="Search (⌘K)"
        >
          <Search size={14} className="shrink-0" />
          <span className="hidden whitespace-nowrap group-hover/sidebar:sm:inline lg:inline">Search</span>
          <kbd
            className="ml-auto hidden rounded px-1 py-0.5 text-[9px] group-hover/sidebar:sm:inline lg:inline"
            style={{ background: "var(--bg-muted)", color: "var(--text-tertiary)" }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Help link */}
      <div className="px-2.5 pb-1 sm:px-1 lg:px-2.5">
        <a
          href="https://docs.adsflow.ai"
          target="_blank"
          rel="noopener noreferrer"
          title="Help & Docs"
          className="flex items-center rounded-md text-[11px] font-medium transition-colors sm:justify-center sm:px-0 sm:py-2 group-hover/sidebar:sm:justify-start group-hover/sidebar:sm:gap-2.5 group-hover/sidebar:sm:px-2.5 group-hover/sidebar:sm:py-1.5 lg:justify-start lg:gap-2.5 lg:px-2.5 lg:py-1.5"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
        >
          <HelpCircle size={14} className="shrink-0" />
          <span className="hidden whitespace-nowrap group-hover/sidebar:sm:inline lg:inline">
            Help &amp; Docs
          </span>
        </a>
      </div>

      {/* User row */}
      <div
        className="flex items-center justify-between border-t px-4 py-3 sm:justify-center sm:px-2 lg:justify-between lg:px-4"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        {isAuthenticated && authUser ? (
          <>
            <div className="flex items-center gap-2.5">
              {authUser.image ? (
                <Image
                  src={authUser.image}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 shrink-0 rounded-full"
                />
              ) : (
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
                  style={{
                    background: "var(--acc-subtle)",
                    color: "var(--acc-text)",
                  }}
                >
                  {authUser.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="hidden flex-col group-hover/sidebar:sm:flex lg:flex">
                <span
                  className="max-w-[100px] truncate text-xs font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {authUser.name || "User"}
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {"Signed in"}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="hidden h-7 w-7 items-center justify-center rounded-md transition-colors group-hover/sidebar:sm:flex lg:flex"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-subtle)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={14} aria-hidden="true" />
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="flex w-full items-center gap-2.5 rounded-md px-1 py-1 text-xs font-medium transition-colors sm:justify-center sm:px-0 lg:justify-start lg:px-1"
            style={{ color: "var(--acc-text)" }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "var(--acc-subtle)",
                color: "var(--acc-text)",
              }}
            >
              <LogIn size={14} />
            </div>
            <span className="hidden whitespace-nowrap group-hover/sidebar:sm:inline lg:inline">
              Sign In
            </span>
          </Link>
        )}
      </div>
    </aside>
  );
}
