"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFocusTrap } from "@/lib/a11y/focusTrap";
import { listCourseGroups } from "@/lib/api/courseGroups";
import { listCourses } from "@/lib/api/courses";
import { listFaqs } from "@/lib/api/faqs";
import { listProducts } from "@/lib/api/products";
import { listProjects } from "@/lib/api/portfolio";
import { listResearch } from "@/lib/api/research";
import { listUsers } from "@/lib/api/users";
import {
  buildCourseCommands,
  buildCourseGroupCommands,
  buildFaqCommands,
  buildPortfolioCommands,
  buildProductCommands,
  buildResearchCommands,
  buildUserCommands,
  filterAdminCommands,
  getStaticAdminCommands,
  type AdminCommandItem,
  type AdminNavSeed,
} from "@/lib/admin/commandSearch";

interface AdminCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  navItems: AdminNavSeed[];
}

export function AdminCommandPalette({
  open,
  onClose,
  navItems,
}: AdminCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [catalog, setCatalog] = useState<AdminCommandItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);

  useFocusTrap(open, dialogRef, {
    initialFocusRef: inputRef,
    restoreFocus: true,
  });

  const staticItems = useMemo(
    () => getStaticAdminCommands(navItems),
    [navItems]
  );

  const allItems = useMemo(
    () => [...staticItems, ...catalog],
    [staticItems, catalog]
  );

  const results = useMemo(
    () => filterAdminCommands(allItems, query),
    [allItems, query]
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setIndex(0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || loadedRef.current) return;

    let cancelled = false;
    setIsLoadingCatalog(true);
    setCatalogError("");

    void Promise.allSettled([
      listCourses({ includeLessons: true }),
      listProducts(),
      listProjects(),
      listResearch(),
      listFaqs({ includeHidden: true }),
      listCourseGroups(),
      listUsers(),
    ]).then((settled) => {
      if (cancelled) return;

      const [
        coursesResult,
        productsResult,
        projectsResult,
        researchResult,
        faqsResult,
        groupsResult,
        usersResult,
      ] = settled;

      const next: AdminCommandItem[] = [];
      if (coursesResult.status === "fulfilled") {
        next.push(...buildCourseCommands(coursesResult.value));
      }
      if (productsResult.status === "fulfilled") {
        next.push(...buildProductCommands(productsResult.value));
      }
      if (projectsResult.status === "fulfilled") {
        next.push(...buildPortfolioCommands(projectsResult.value));
      }
      if (researchResult.status === "fulfilled") {
        next.push(...buildResearchCommands(researchResult.value));
      }
      if (faqsResult.status === "fulfilled") {
        next.push(...buildFaqCommands(faqsResult.value));
      }
      if (groupsResult.status === "fulfilled") {
        next.push(...buildCourseGroupCommands(groupsResult.value));
      }
      if (usersResult.status === "fulfilled") {
        next.push(...buildUserCommands(usersResult.value));
      }

      const failed = settled.filter((result) => result.status === "rejected").length;
      setCatalog(next);
      loadedRef.current = true;
      setIsLoadingCatalog(false);
      if (failed > 0 && next.length === 0) {
        setCatalogError("Couldn't load courses and records for search.");
      } else if (failed > 0) {
        setCatalogError("Some records couldn't be loaded for search.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    setIndex(0);
  }, [query, results.length]);

  function openItem(item: AdminCommandItem) {
    onClose();
    router.push(item.href);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-[70] bg-charcoal/55"
            aria-label="Close admin search"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Admin search"
            className="fixed left-1/2 top-[12vh] z-[71] w-[min(38rem,92vw)] -translate-x-1/2 hairline-border bg-concrete p-3 shadow-2xl"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setIndex((current) =>
                  Math.min(results.length - 1, current + 1)
                );
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setIndex((current) => Math.max(0, current - 1));
              }
              if (event.key === "Enter" && results[index]) {
                event.preventDefault();
                openItem(results[index]);
              }
            }}
          >
            <label htmlFor="admin-command-search" className="sr-only">
              Search admin pages, actions, courses and lessons
            </label>
            <input
              ref={inputRef}
              id="admin-command-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search actions, courses, lessons…"
              className="w-full border border-hairline bg-concrete-dark/30 px-4 py-3 type-body"
              role="combobox"
              aria-expanded="true"
              aria-controls="admin-command-results"
              aria-activedescendant={
                results[index] ? `command-${index}` : undefined
              }
              autoComplete="off"
            />
            <ul
              id="admin-command-results"
              role="listbox"
              className="mt-2 max-h-[55vh] overflow-y-auto"
            >
              {results.map((item, resultIndex) => (
                <li
                  key={item.id}
                  id={`command-${resultIndex}`}
                  role="option"
                  aria-selected={resultIndex === index}
                >
                  <button
                    type="button"
                    className={`flex w-full items-start justify-between gap-4 px-4 py-3 text-left ${
                      resultIndex === index ? "bg-concrete-dark" : ""
                    }`}
                    onMouseEnter={() => setIndex(resultIndex)}
                    onClick={() => openItem(item)}
                  >
                    <span className="min-w-0">
                      <span className="block font-sans text-sm font-medium text-charcoal">
                        {item.label}
                      </span>
                      <span className="type-infill mt-0.5 block truncate text-charcoal-muted">
                        {item.description}
                      </span>
                    </span>
                    <span className="dim-label shrink-0 pt-0.5">
                      {item.category}
                    </span>
                  </button>
                </li>
              ))}
              {results.length === 0 && (
                <li className="p-4 type-infill">
                  {isLoadingCatalog
                    ? "Loading courses and records…"
                    : "No matching pages, actions, or records."}
                </li>
              )}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline px-4 pt-3">
              <p className="dim-label">↑↓ navigate · Enter open · Esc close</p>
              {isLoadingCatalog && (
                <p className="dim-label text-charcoal-muted">Loading records…</p>
              )}
              {!isLoadingCatalog && catalogError && (
                <p className="dim-label text-charcoal-muted">{catalogError}</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
