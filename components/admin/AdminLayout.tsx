"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PageContainer } from "@/components/layout/PageContainer";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { useAuth } from "@/hooks/useAuth";
import { useFocusTrap } from "@/lib/a11y/focusTrap";
import { easeOut, navTransition } from "@/lib/motion";

const navItems = [
  { href: "/admin", label: "Dashboard", sheetRef: "ADM-00" },
  { href: "/admin/homepage", label: "Homepage", sheetRef: "CMS-01" },
  { href: "/admin/settings", label: "Site Settings", sheetRef: "CMS-02" },
  { href: "/admin/course-groups", label: "Course Groups", sheetRef: "GRP-01" },
  { href: "/admin/courses", label: "Courses", sheetRef: "CRS-02" },
  { href: "/admin/products", label: "Products", sheetRef: "PRD-03" },
  { href: "/admin/portfolio", label: "Portfolio", sheetRef: "PRT-04" },
  { href: "/admin/research", label: "Research", sheetRef: "RES-05" },
  { href: "/admin/orders", label: "Orders", sheetRef: "ORD-06" },
  { href: "/admin/services", label: "Services", sheetRef: "SRV-07" },
  { href: "/admin/users", label: "Users", sheetRef: "USR-08" },
];

function isActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <ul className="flex w-full flex-col gap-1">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href} className="w-full min-w-0">
            <Link
              href={item.href}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={`group relative flex w-full min-w-0 items-center border py-3 transition-colors duration-200 ${
                collapsed ? "justify-center px-2" : "px-3"
              } ${
                active
                  ? "border-hairline bg-concrete text-charcoal"
                  : "border-transparent text-charcoal-infill hover:border-hairline hover:bg-concrete hover:text-charcoal"
              }`}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-[3px] bg-clay"
                />
              )}
              {collapsed ? (
                <span className="shrink-0 font-sans text-[0.8125rem] uppercase tracking-[0.1em] tabular-nums text-clay">
                  {item.sheetRef.split("-")[0]}
                </span>
              ) : (
                <span
                  className={`min-w-0 font-sans text-[0.875rem] uppercase tracking-[0.1em] leading-snug ${
                    active ? "text-charcoal" : ""
                  }`}
                >
                  {item.label}
                </span>
              )}
              {!active && (
                <motion.span
                  className="pointer-events-none absolute inset-x-3 bottom-0 h-px bg-charcoal/30 origin-left"
                  initial={false}
                  animate={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={navTransition}
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(mobileNavOpen, mobileDrawerRef, {
    initialFocusRef: mobileCloseRef,
    restoreFocus: false,
  });

  useEffect(() => {
    setCollapsed(localStorage.getItem("sawy-admin-sidebar") === "collapsed");
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileNavOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [mobileNavOpen]);

  function requestLogout() {
    setMobileNavOpen(false);
    setLogoutOpen(true);
  }

  function confirmLogout() {
    setLogoutOpen(false);
    logout();
    router.replace("/login");
  }

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(
        "sawy-admin-sidebar",
        next ? "collapsed" : "expanded"
      );
      return next;
    });
  }

  return (
    <div
      className={`admin-shell min-h-screen bg-concrete text-charcoal lg:grid transition-[grid-template-columns] duration-300 motion-reduce:transition-none ${
        collapsed
          ? "lg:grid-cols-[5.5rem_minmax(0,1fr)]"
          : "lg:grid-cols-[18rem_minmax(0,1fr)]"
      }`}
    >
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-hairline bg-concrete-dark/95 px-4 py-3 nav-blur lg:hidden">
        <Link href="/admin" className="min-w-0">
          <p className="eyebrow text-clay truncate">Sawy Academy</p>
          <p className="label-caps mt-1">Admin</p>
        </Link>
        <button
          ref={menuButtonRef}
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-compact shrink-0"
          onClick={() => setMobileNavOpen(true)}
          aria-expanded={mobileNavOpen}
          aria-controls="admin-mobile-nav"
        >
          Menu
        </button>
      </div>

      {/* Mobile drawer — slides in from the right */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-50 bg-charcoal/45 lg:hidden"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.2,
                ease: easeOut,
              }}
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              ref={mobileDrawerRef}
              id="admin-mobile-nav"
              className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,88vw)] flex-col border-l border-hairline bg-concrete-dark shadow-[-8px_0_24px_rgba(26,26,26,0.12)] outline-none lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
              tabIndex={-1}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.32,
                ease: easeOut,
              }}
            >
              <div className="flex items-center justify-end border-b border-hairline px-3 py-2.5">
                <button
                  ref={mobileCloseRef}
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-compact"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Close
                </button>
              </div>
              <nav
                aria-label="Admin sections"
                className="flex-1 overflow-y-auto px-3 py-2"
              >
                <NavLinks onNavigate={() => setMobileNavOpen(false)} />
              </nav>
              <div className="space-y-2 border-t border-hairline px-3 py-2.5">
                <p className="type-infill truncate text-[0.8125rem]">
                  {user.name}
                </p>
                <div className="flex gap-2">
                  <Link
                    href="/"
                    className="admin-btn admin-btn-secondary admin-btn-compact flex-1"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    Live site
                  </Link>
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger admin-btn-compact flex-1"
                    onClick={requestLogout}
                  >
                    Log out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:min-h-screen lg:w-full lg:flex-col lg:border-r lg:border-hairline bg-concrete-dark/70">
        <div className={`w-full min-w-0 ${collapsed ? "p-3" : "p-6"}`}>
          <div className="flex flex-col gap-4">
            <Link href="/admin" className="block min-w-0">
              <p className="eyebrow text-clay">
                {collapsed ? "SA" : "Sawy Academy"}
              </p>
              {!collapsed && (
                <p className="label-caps mt-2">Admin tool palette</p>
              )}
            </Link>

            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-compact w-full"
              onClick={toggleSidebar}
              aria-label={
                collapsed ? "Expand admin sidebar" : "Collapse admin sidebar"
              }
              aria-expanded={!collapsed}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span aria-hidden="true">{collapsed ? "→" : "←"}</span>
              {!collapsed && <span>Collapse</span>}
            </button>

            {!collapsed && (
              <ScaleBar scale="1:50" className="max-w-[120px]" />
            )}
          </div>

          <nav
            aria-label="Admin sections"
            className={`w-full min-w-0 ${collapsed ? "mt-4" : "mt-8"}`}
          >
            {/* Sticky lives here only — a sticky ancestor on the aside content
                would create a containing block and block this from sticking. */}
            <div className="sticky top-0 z-10 w-full min-w-0 bg-concrete-dark/70 py-1">
              <NavLinks collapsed={collapsed} />
            </div>
          </nav>

          <div
            className={`border-t border-hairline pt-4 ${
              collapsed ? "mt-4" : "mt-8"
            }`}
          >
            <button
              type="button"
              className="admin-btn admin-btn-danger admin-btn-compact w-full"
              onClick={requestLogout}
              title="Log out"
            >
              {collapsed ? "Out" : "Log out"}
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 hidden border-b border-hairline bg-concrete/95 nav-blur lg:block">
          <PageContainer className="flex h-16 items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="label-caps">Control room</p>
              <p className="type-infill mt-1 truncate">{user.name}</p>
            </div>
            <Link
              href="/"
              className="admin-btn admin-btn-secondary admin-btn-compact shrink-0"
            >
              View live site
            </Link>
          </PageContainer>
        </header>

        <main>
          <PageContainer className="py-6 sm:py-8 lg:py-10">
            {children}
          </PageContainer>
        </main>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        title="Log out?"
        message="You will need to sign in again to reach the control room."
        confirmLabel="Log out"
        confirmTone="primary"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
