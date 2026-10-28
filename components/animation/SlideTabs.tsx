"use client";

import { motion } from "framer-motion";

export interface TabOption {
  id: string;
  label: string;
  badge?: string | number;
}

interface SlideTabsProps {
  tabs: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function SlideTabs({
  tabs,
  activeTab,
  onChange,
  className = "",
}: SlideTabsProps) {
  return (
    <ul
      role="tablist"
      className={`relative flex flex-wrap items-center gap-1 sm:gap-2 p-1 border border-hairline bg-concrete/60 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <li key={tab.id} role="presentation" className="relative">
            <button
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`relative z-10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-mono tracking-wider transition-colors duration-200 cursor-pointer select-none ${
                isActive
                  ? "text-concrete font-medium"
                  : "text-charcoal-muted hover:text-charcoal"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`ml-2 text-[0.7rem] px-1.5 py-0.2 border ${
                    isActive
                      ? "border-concrete/40 text-concrete"
                      : "border-charcoal/20 text-charcoal/60"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>

            {isActive && (
              <motion.div
                layoutId="slideTabActivePill"
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 35,
                }}
                className="absolute inset-0 z-0 bg-charcoal"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
