"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCart } from "@/components/cart/CartProvider";
import { useAuth } from "@/hooks/useAuth";
import { Wordmark } from "@/components/Wordmark";
import { navTransition } from "@/lib/motion";

/**
 * Primary content navigation. "Practice" groups the professor's output
 * (Portfolio + Researches) behind a minimal flyout; Courses/Products/Services
 * stay standalone as distinct commercial offerings. Contact is retained here
 * for now — see report; it is also present in the Footer.
 */
const practiceChildren = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/researches", label: "Researches" },
];

const contentLinks = [
  { href: "/courses", label: "Courses" },
  { href: "/products", label: "Products" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string, href: string) {
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

/** Shopping-bag glyph with enough weight to remain legible at nav size. */
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

function PracticeMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const active =
    isActive(pathname, "/portfolio") || isActive(pathname, "/researches");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`relative eyebrow pb-1 inline-flex items-center gap-1.5 transition-colors duration-200 ${
          active ? "text-clay" : "text-charcoal-infill hover:text-charcoal"
        }`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        Practice
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
            className="absolute left-0 top-full pt-3"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={prefersReducedMotion ? { duration: 0 } : navTransition}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setOpen(false);
              }
            }}
          >
            <div className="hairline-border bg-concrete/98 min-w-[13.5rem] backdrop-blur-sm">
              {practiceChildren.map((child, i) => (
                <div key={child.href} className={i > 0 ? "hairline-t" : ""}>
                  <Link
                    href={child.href}
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
  const [practiceOpen, setPracticeOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { count } = useCart();
  const { isAuthenticated, isAdmin, user } = useAuth();

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
    setPracticeOpen(false);
  }, [pathname]);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50"
      initial={false}
      animate={{
        backgroundColor: scrolled || open
          ? "rgba(245, 243, 239, 0.94)"
          : "rgba(245, 243, 239, 0)",
        backdropFilter: scrolled || open ? "blur(12px)" : "blur(0px)",
      }}
      transition={prefersReducedMotion ? { duration: 0 } : navTransition}
    >
      <nav className="site-container flex items-center justify-between h-16 lg:h-20">
        <Wordmark />

        <div className="hidden md:flex items-center gap-6">
          <ul className="flex items-center gap-6">
            <li>
              <PracticeMenu pathname={pathname} />
            </li>
            {contentLinks.map((link) => (
              <li key={link.href}>
                <NavLink
                  href={link.href}
                  label={link.label}
                  active={isActive(pathname, link.href)}
                />
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
          className="md:hidden eyebrow text-charcoal"
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
          className="md:hidden hairline-t bg-concrete/98 px-6 pb-5 pt-3"
        >
          <ul className="flex flex-col gap-1">
            <li>
              <button
                type="button"
                className={`w-full flex items-center justify-between eyebrow py-2 ${
                  isActive(pathname, "/portfolio") ||
                  isActive(pathname, "/researches")
                    ? "text-clay"
                    : "text-charcoal-infill"
                }`}
                aria-expanded={practiceOpen}
                onClick={() => setPracticeOpen((v) => !v)}
              >
                Practice
                <Chevron open={practiceOpen} />
              </button>
              <AnimatePresence initial={false}>
                {practiceOpen && (
                  <motion.ul
                    className="overflow-hidden pl-4"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={
                      prefersReducedMotion ? { duration: 0 } : navTransition
                    }
                  >
                    {practiceChildren.map((child) => (
                      <li key={child.href}>
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

            {contentLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`eyebrow block py-2 ${
                    isActive(pathname, link.href)
                      ? "text-clay"
                      : "text-charcoal-infill"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
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
