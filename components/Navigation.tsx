"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50"
      initial={false}
      animate={{
        backgroundColor: scrolled
          ? "rgba(245, 243, 239, 0.94)"
          : "rgba(245, 243, 239, 0)",
        backdropFilter: scrolled ? "blur(12px)" : "blur(0px)",
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
          <ul className="flex flex-col gap-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`eyebrow block py-1 ${
                    pathname === link.href ||
                    pathname.startsWith(`${link.href}/`)
                      ? "text-clay"
                      : "text-charcoal-infill"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {count > 0 && (
              <li>
                <Link href="/products" className="eyebrow block py-1 text-clay">
                  Cart ({count})
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </motion.header>
  );
}
