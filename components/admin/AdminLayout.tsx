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
  { href: "/admin", label: "Dashboard", description: "Overview and common tasks", shortLabel: "Home", group: "Start here" },
  { href: "/admin/homepage", label: "Homepage", description: "Arrange homepage sections", shortLabel: "Page", group: "Website" },
  { href: "/admin/settings", label: "Site settings", description: "Brand, navigation and pages", shortLabel: "Site", group: "Website" },
  { href: "/admin/portfolio", label: "Portfolio", description: "Published project work", shortLabel: "Work", group: "Website" },
  { href: "/admin/research", label: "Research", description: "Articles and publications", shortLabel: "Read", group: "Website" },
  { href: "/admin/faqs", label: "FAQs", description: "Public questions and answers", shortLabel: "FAQ", group: "Website" },
  { href: "/admin/course-groups", label: "Course groups", description: "Organize related courses", shortLabel: "Groups", group: "Courses & shop" },
  { href: "/admin/courses", label: "Courses", description: "Course details and lessons", shortLabel: "Learn", group: "Courses & shop" },
  { href: "/admin/products", label: "Products", description: "Shop products and pricing", shortLabel: "Shop", group: "Courses & shop" },
  { href: "/admin/orders", label: "Orders", description: "Review customer payments", shortLabel: "Orders", group: "Requests & safety" },
  { href: "/admin/services", label: "Service requests", description: "Manage client enquiries", shortLabel: "Requests", group: "Requests & safety" },
  { href: "/admin/video-access-flags", label: "Video access alerts", description: "Review unusual viewing activity", shortLabel: "Alerts", group: "Requests & safety" },
  { href: "/admin/users", label: "Users", description: "Accounts and registered devices", shortLabel: "People", group: "People" },
];
const navGroups = ["Start here", "Website", "Courses & shop", "Requests & safety", "People"];

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
    <div className="flex w-full flex-col gap-4">
      {navGroups.map((group) => (
      <div key={group}>
        {!collapsed && <p className="dim-label mb-1 px-3">{group}</p>}
        <ul className="flex w-full flex-col gap-1">
      {navItems.filter((item) => item.group === group).map((item) => {
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
                  {item.shortLabel}
                </span>
              ) : (
                <span className="min-w-0">
                  <span
                    className={`block font-sans text-[0.875rem] font-medium leading-snug ${
                      active ? "text-charcoal" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.72rem] leading-snug text-charcoal-muted">
                    {item.description}
                  </span>
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
      </div>
      ))}
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [commandIndex, setCommandIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  useFocusTrap(mobileNavOpen, mobileDrawerRef, {
    initialFocusRef: mobileCloseRef,
    restoreFocus: false,
  });
  useFocusTrap(commandOpen, commandRef, {
    initialFocusRef: commandInputRef,
    restoreFocus: true,
  });

  const commandResults = navItems.filter((item) =>
    item.label.toLocaleLowerCase().includes(commandQuery.trim().toLocaleLowerCase())
  );
  const currentNavItem =
    navItems.find((item) => isActive(pathname, item.href)) ?? navItems[0];
  const pathTail = pathname.slice(currentNavItem.href.length).split("/").filter(Boolean);
  const detailLabel =
    pathTail[0] === "new"
      ? "Add new"
      : pathTail.at(-1) === "edit"
        ? "Edit"
        : pathTail.length > 0
          ? "Details"
          : "";

  useEffect(() => {
    setCollapsed(localStorage.getItem("sawy-admin-sidebar") === "collapsed");
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
    setCommandOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  useEffect(() => {
    if (!commandOpen) return;
    setCommandQuery("");
    setCommandIndex(0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [commandOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileNavOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      menuButton?.focus();
    };
  }, [mobileNavOpen]);

  function requestLogout() {
    setMobileNavOpen(false);
    setLogoutOpen(true);
  }

  function confirmLogout() {
    setLogoutOpen(false);
    void logout().then(() => router.replace("/login"));
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
        <div className="flex gap-2">
          <button type="button" className="admin-btn admin-btn-secondary admin-btn-compact" onClick={() => setCommandOpen(true)} aria-label="Search admin pages">Search</button>
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

      <AnimatePresence>
        {commandOpen && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-[70] bg-charcoal/55"
              aria-label="Close page search"
              onClick={() => setCommandOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              ref={commandRef}
              role="dialog"
              aria-modal="true"
              aria-label="Admin page search"
              className="fixed left-1/2 top-[12vh] z-[71] w-[min(38rem,92vw)] -translate-x-1/2 hairline-border bg-concrete p-3 shadow-2xl"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              onKeyDown={(event) => {
                if (event.key === "Escape") setCommandOpen(false);
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setCommandIndex((index) => Math.min(commandResults.length - 1, index + 1));
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setCommandIndex((index) => Math.max(0, index - 1));
                }
                if (event.key === "Enter" && commandResults[commandIndex]) {
                  router.push(commandResults[commandIndex].href);
                }
              }}
            >
              <label htmlFor="admin-command-search" className="sr-only">Go to an admin page</label>
              <input
                ref={commandInputRef}
                id="admin-command-search"
                value={commandQuery}
                onChange={(event) => {
                  setCommandQuery(event.target.value);
                  setCommandIndex(0);
                }}
                placeholder="Go to a page…"
                className="w-full border border-hairline bg-concrete-dark/30 px-4 py-3 type-body"
                role="combobox"
                aria-expanded="true"
                aria-controls="admin-command-results"
                aria-activedescendant={commandResults[commandIndex] ? `command-${commandIndex}` : undefined}
              />
              <ul id="admin-command-results" role="listbox" className="mt-2 max-h-[55vh] overflow-y-auto">
                {commandResults.map((item, index) => (
                  <li key={item.href} id={`command-${index}`} role="option" aria-selected={index === commandIndex}>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between px-4 py-3 text-left ${index === commandIndex ? "bg-concrete-dark" : ""}`}
                      onMouseEnter={() => setCommandIndex(index)}
                      onClick={() => router.push(item.href)}
                    >
                      <span>{item.label}</span><span className="type-infill text-charcoal-muted">{item.description}</span>
                    </button>
                  </li>
                ))}
                {commandResults.length === 0 && <li className="p-4 type-infill">No matching pages.</li>}
              </ul>
              <p className="dim-label border-t border-hairline px-4 pt-3">↑↓ navigate · Enter open · Esc close</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:min-h-screen lg:w-full lg:flex-col lg:border-r lg:border-hairline bg-concrete-dark/70">
        {/* flex-1 fills the tall aside so the nav below has sticky runway;
            do not put sticky on this wrapper — nested sticky ancestors block the list. */}
        <div
          className={`flex w-full min-w-0 flex-1 flex-col ${
            collapsed ? "p-3" : "p-6"
          }`}
        >
          <div className="flex flex-col gap-4">
            <Link href="/admin" className="block min-w-0">
              <p className="eyebrow text-clay">
                {collapsed ? "SA" : "Sawy Academy"}
              </p>
              {!collapsed && (
                <p className="label-caps mt-2">Admin menu</p>
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
            className={`w-full min-w-0 flex-1 ${collapsed ? "mt-4" : "mt-8"}`}
          >
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
              <nav aria-label="Breadcrumb" className="flex items-center gap-2">
                <Link href="/admin" className="label-caps hover:text-clay">Admin</Link>
                {pathname !== "/admin" && (
                  <>
                    <span aria-hidden="true">/</span>
                    {detailLabel ? (
                      <>
                        <Link href={currentNavItem.href} className="label-caps hover:text-clay">
                          {currentNavItem.label}
                        </Link>
                        <span aria-hidden="true">/</span>
                        <span className="label-caps" aria-current="page">{detailLabel}</span>
                      </>
                    ) : (
                      <span className="label-caps" aria-current="page">{currentNavItem.label}</span>
                    )}
                  </>
                )}
              </nav>
              <p className="type-infill mt-1 truncate">{user.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="admin-btn admin-btn-secondary admin-btn-compact" onClick={() => setCommandOpen(true)}>
                Search <kbd className="ml-2 opacity-60">Ctrl K</kbd>
              </button>
              <Link href="/" className="admin-btn admin-btn-secondary admin-btn-compact shrink-0">View live site</Link>
            </div>
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
        message="You will need to sign in again to open the admin panel."
        confirmLabel="Log out"
        confirmTone="primary"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
