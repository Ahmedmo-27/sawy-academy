"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCart } from "@/components/cart/CartProvider";
import { Wordmark } from "@/components/Wordmark";
import { navTransition } from "@/lib/motion";

const links = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/researches", label: "Researches" },
  { href: "/courses", label: "Courses" },
  { href: "/products", label: "Products" },
  { href: "/contact", label: "Contact" },
];

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

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span
      className="relative flex h-[18px] w-[22px] flex-col justify-between"
      aria-hidden="true"
    >
      <span
        className={`block h-[1.5px] w-full rounded-full bg-charcoal transition-transform duration-300 origin-center ${
          open ? "translate-y-[8.25px] rotate-45" : ""
        }`}
      />
      <span
        className={`block h-[1.5px] w-full rounded-full bg-charcoal transition-opacity duration-200 ${
          open ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`block h-[1.5px] w-full rounded-full bg-charcoal transition-transform duration-300 origin-center ${
          open ? "-translate-y-[8.25px] -rotate-45" : ""
        }`}
      />
    </span>
  );
}

function MobileNavDrawer({
  open,
  onClose,
  pathname,
  count,
  prefersReducedMotion,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  count: number;
  prefersReducedMotion: boolean | null;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="md:hidden fixed inset-0 z-[80] bg-charcoal/30"
            style={{
              top: "calc(var(--nav-height) + env(safe-area-inset-top))",
            }}
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="md:hidden fixed right-0 z-[90] flex w-[min(17.5rem,100%)] max-w-[calc(100%-1rem)] flex-col border-l border-hairline bg-concrete shadow-[-12px_0_40px_rgba(26,26,26,0.1)]"
            style={{
              top: "calc(var(--nav-height) + env(safe-area-inset-top))",
              bottom: 0,
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.32,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <ul className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
              {links.map((link) => {
                const active =
                  pathname === link.href ||
                  pathname.startsWith(`${link.href}/`);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`eyebrow flex min-h-12 items-center border-b border-hairline/50 transition-colors ${
                        active ? "text-clay" : "text-charcoal-infill"
                      }`}
                      onClick={onClose}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              {count > 0 && (
                <li>
                  <Link
                    href="/products"
                    className="eyebrow flex min-h-12 items-center text-clay"
                    onClick={onClose}
                  >
                    Cart ({count})
                  </Link>
                </li>
              )}
            </ul>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function Navigation() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { count } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-[100] pt-[env(safe-area-inset-top)] isolate"
        initial={false}
        animate={{
          backgroundColor: scrolled || open
            ? "rgba(245, 243, 239, 0.98)"
            : "rgba(245, 243, 239, 0)",
          backdropFilter: scrolled || open ? "blur(12px)" : "blur(0px)",
        }}
        transition={prefersReducedMotion ? { duration: 0 } : navTransition}
      >
        <nav className="site-container flex h-[var(--nav-height)] items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Wordmark />
          </div>

          <ul className="hidden md:flex shrink-0 items-center gap-6 lg:gap-10">
            {links.map((link) => (
              <li key={link.href}>
                <NavLink
                  href={link.href}
                  label={link.label}
                  active={
                    pathname === link.href ||
                    pathname.startsWith(`${link.href}/`)
                  }
                />
              </li>
            ))}
            {count > 0 && (
              <li>
                <Link href="/products" className="eyebrow text-clay tabular-nums">
                  Cart ({count})
                </Link>
              </li>
            )}
          </ul>

          <button
            type="button"
            className="md:hidden relative shrink-0 flex items-center justify-center min-h-11 min-w-11 rounded-sm border border-hairline/80 bg-concrete text-charcoal transition-colors duration-200 hover:border-hairline hover:bg-concrete-dark/80"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <MenuIcon open={open} />
            {!open && count > 0 && (
              <span
                className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[0.5625rem] font-medium leading-none text-concrete tabular-nums"
                aria-hidden="true"
              >
                {count}
              </span>
            )}
          </button>
        </nav>
      </motion.header>

      <MobileNavDrawer
        open={open}
        onClose={() => setOpen(false)}
        pathname={pathname}
        count={count}
        prefersReducedMotion={prefersReducedMotion}
      />
    </>
  );
}
