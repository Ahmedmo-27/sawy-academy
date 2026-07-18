"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCart } from "@/components/cart/CartProvider";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/components/cms/SiteContentProvider";
import { Wordmark } from "@/components/Wordmark";
import { navTransition } from "@/lib/motion";
import type { NavLinkItem } from "@/lib/api/types";

function isActive(pathname: string, href: string) {
  if (!href) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Chevron({ open }: { open: boolean }) {
  return (
    <motion.svg
      width="9"
      height="9"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
      style={{ transformOrigin: "center" }}
      initial={false}
      animate={{ rotate: open ? 180 : 0 }}
      transition={navTransition}
    >
      <path
        d="M2 3.5 L5 6.5 L8 3.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

function CartGlyph() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5.5 8.5 H18.5 L17.5 20 H6.5 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 8.5 V6.5 A3 3 0 0 1 15 6.5 V8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative eyebrow pb-1 transition-colors duration-200 ${
        active ? "text-clay" : "text-charcoal-infill hover:text-charcoal"
      }`}
    >
      {label}
      <motion.span
        className="absolute bottom-0 left-0 h-px w-full bg-current origin-left"
        initial={false}
        animate={{ scaleX: active ? 1 : 0 }}
        whileHover={{ scaleX: 1 }}
        transition={navTransition}
      />
    </Link>
  );
}

function FlyoutMenu({
  item,
  pathname,
}: {
  item: NavLinkItem;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = `nav-menu-${item.id}`;
  const children = item.children ?? [];
  const active = children.some((child) => isActive(pathname, child.href));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function focusItem(index: number) {
    const items = menuRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]");
    items?.[index]?.focus();
  }

  function onButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
      window.setTimeout(() => focusItem(0), 0);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      window.setTimeout(() => focusItem(children.length - 1), 0);
    }
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = menuRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]");
    if (!items?.length) return;

    const currentIndex = Array.from(items).indexOf(
      document.activeElement as HTMLAnchorElement
    );

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusItem((currentIndex + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusItem((currentIndex - 1 + items.length) % items.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusItem(items.length - 1);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        className={`relative eyebrow pb-1 inline-flex items-center gap-1.5 transition-colors duration-200 ${
          active ? "text-clay" : "text-charcoal-infill hover:text-charcoal"
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
      >
        {item.label}
        <Chevron open={open} />
        <motion.span
          className="absolute bottom-0 left-0 h-px w-full bg-current origin-left"
          initial={false}
          animate={{ scaleX: active || open ? 1 : 0 }}
          transition={navTransition}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={item.label}
            className="absolute left-0 top-full pt-3"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={prefersReducedMotion ? { duration: 0 } : navTransition}
            onKeyDown={onMenuKeyDown}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setOpen(false);
              }
            }}
          >
            <div className="hairline-border bg-concrete/98 min-w-[13.5rem] backdrop-blur-sm">
              {children.map((child, i) => (
                <div key={child.id || child.href} className={i > 0 ? "hairline-t" : ""}>
                  <Link
                    href={child.href}
                    role="menuitem"
                    className={`block whitespace-nowrap px-5 py-3 eyebrow transition-colors duration-200 ${
                      isActive(pathname, child.href)
                        ? "text-clay"
                        : "text-charcoal-infill hover:text-charcoal"
                    }`}
                  >
                    {child.label}
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [flyoutOpenId, setFlyoutOpenId] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { count } = useCart();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const { settings } = useSiteSettings();
  const navItems = settings.navigation?.items ?? [];

  const accountHref = isAdmin
    ? "/admin"
    : isAuthenticated
      ? "/dashboard/profile"
      : "/login";
  const accountLabel = isAdmin
    ? "Go to admin panel"
    : isAuthenticated
      ? user.name?.split(" ")[0] || "Account"
      : "Login";
  const cartActive = isActive(pathname, "/cart");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setFlyoutOpenId(null);
  }, [pathname]);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50"
      initial={false}
      animate={{
        backgroundColor:
          scrolled || open
            ? "rgba(245, 243, 239, 0.94)"
            : "rgba(245, 243, 239, 0)",
        backdropFilter: scrolled || open ? "blur(12px)" : "blur(0px)",
      }}
      transition={prefersReducedMotion ? { duration: 0 } : navTransition}
    >
      <nav
        className="site-container flex items-center justify-between gap-6 lg:gap-10 h-16 lg:h-20"
        aria-label="Primary"
      >
        <Wordmark />

        <div className="hidden lg:flex items-center gap-5 xl:gap-6 shrink-0">
          <ul className="flex items-center gap-5 xl:gap-6">
            {navItems.map((item) => (
              <li key={item.id}>
                {item.children && item.children.length > 0 ? (
                  <FlyoutMenu item={item} pathname={pathname} />
                ) : (
                  <NavLink
                    href={item.href}
                    label={item.label}
                    active={isActive(pathname, item.href)}
                  />
                )}
              </li>
            ))}
          </ul>

          <span className="h-4 w-px bg-hairline" aria-hidden="true" />

          <div className="flex items-center gap-6">
            <Link
              href="/cart"
              aria-label={
                count > 0
                  ? `Cart, ${count} item${count === 1 ? "" : "s"}`
                  : "Cart"
              }
              className={`relative inline-flex items-center transition-colors duration-200 ${
                cartActive
                  ? "text-clay"
                  : "text-charcoal-infill hover:text-charcoal"
              }`}
            >
              <CartGlyph />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-2 label-caps text-[9px] leading-none text-clay">
                  {count}
                </span>
              )}
            </Link>

            <NavLink
              href={accountHref}
              label={accountLabel}
              active={isActive(pathname, accountHref)}
            />
          </div>
        </div>

        <button
          type="button"
          className="lg:hidden eyebrow text-charcoal"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? "Close" : count > 0 ? `Menu (${count})` : "Menu"}
        </button>
      </nav>

      {open && (
        <div
          id="mobile-nav"
          className="lg:hidden hairline-t bg-concrete/98 px-6 pb-5 pt-3"
        >
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const children = item.children ?? [];
              if (children.length > 0) {
                const expanded = flyoutOpenId === item.id;
                const active = children.some((child) =>
                  isActive(pathname, child.href)
                );
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`w-full flex items-center justify-between eyebrow py-2 ${
                        active ? "text-clay" : "text-charcoal-infill"
                      }`}
                      aria-expanded={expanded}
                      onClick={() =>
                        setFlyoutOpenId((current) =>
                          current === item.id ? null : item.id
                        )
                      }
                    >
                      {item.label}
                      <Chevron open={expanded} />
                    </button>
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.ul
                          className="overflow-hidden pl-4"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={
                            prefersReducedMotion
                              ? { duration: 0 }
                              : navTransition
                          }
                        >
                          {children.map((child) => (
                            <li key={child.id || child.href}>
                              <Link
                                href={child.href}
                                className={`eyebrow block py-2 ${
                                  isActive(pathname, child.href)
                                    ? "text-clay"
                                    : "text-charcoal-infill"
                                }`}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </li>
                );
              }

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={`eyebrow block py-2 ${
                      isActive(pathname, item.href)
                        ? "text-clay"
                        : "text-charcoal-infill"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hairline-t mt-4 pt-4 flex items-center justify-between">
            <Link
              href="/cart"
              className={`inline-flex items-center gap-2 eyebrow ${
                cartActive ? "text-clay" : "text-charcoal-infill"
              }`}
              aria-label={
                count > 0
                  ? `Cart, ${count} item${count === 1 ? "" : "s"}`
                  : "Cart"
              }
            >
              <CartGlyph />
              {count > 0 ? `Cart (${count})` : "Cart"}
            </Link>

            <Link
              href={accountHref}
              className={`eyebrow ${
                isActive(pathname, accountHref)
                  ? "text-clay"
                  : "text-charcoal-infill"
              }`}
            >
              {accountLabel}
            </Link>
          </div>
        </div>
      )}
    </motion.header>
  );
}
