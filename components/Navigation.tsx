"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
    <span className="relative flex h-4 w-5 flex-col justify-between" aria-hidden="true">
      <span
        className={`block h-px w-full bg-charcoal transition-transform duration-300 origin-center ${
          open ? "translate-y-[7px] rotate-45" : ""
        }`}
      />
      <span
        className={`block h-px w-full bg-charcoal transition-opacity duration-200 ${
          open ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`block h-px w-full bg-charcoal transition-transform duration-300 origin-center ${
          open ? "-translate-y-[7px] -rotate-45" : ""
        }`}
      />
    </span>
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

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)]"
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

        <ul className="hidden md:flex items-center gap-6 lg:gap-10">
          {links.map((link) => (
            <li key={link.href}>
              <NavLink
                href={link.href}
                label={link.label}
                active={
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
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
          className="md:hidden flex items-center gap-3 eyebrow text-charcoal py-2 -mr-1"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <MenuIcon open={open} />
          <span className="sr-only">{open ? "Close" : "Menu"}</span>
          {!open && count > 0 && (
            <span className="tabular-nums text-clay">({count})</span>
          )}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              className="md:hidden fixed inset-0 z-40 bg-charcoal/20 top-[calc(4rem+env(safe-area-inset-top))]"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              id="mobile-nav"
              className="md:hidden relative z-50 hairline-t bg-concrete/98 px-5 sm:px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 max-h-[calc(100dvh-4rem-env(safe-area-inset-top))] overflow-y-auto"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            >
              <ul className="flex flex-col gap-1">
                {links.map((link) => {
                  const active =
                    pathname === link.href ||
                    pathname.startsWith(`${link.href}/`);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`eyebrow block py-3 border-b border-hairline/60 ${
                          active ? "text-clay" : "text-charcoal-infill"
                        }`}
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
                      className="eyebrow block py-3 text-clay"
                    >
                      Cart ({count})
                    </Link>
                  </li>
                )}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
