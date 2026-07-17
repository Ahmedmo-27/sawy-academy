"use client";

import { useEffect, useMemo, useState } from "react";
import { listResearch } from "@/lib/api/research";
import type { Research } from "@/lib/api/types";

interface ResearchEntryPickerProps {
  value: string;
  onChange: (researchId: string, research?: Research) => void;
  error?: string;
}

export function ResearchEntryPicker({
  value,
  onChange,
  error,
}: ResearchEntryPickerProps) {
  const [entries, setEntries] = useState<Research[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = await listResearch();
        if (!cancelled) setEntries(data);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Unable to load research entries."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = entries.find((entry) => entry.id === value);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return entries;

    return entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(term) ||
        entry.year.includes(term) ||
        entry.category.toLowerCase().includes(term)
    );
  }, [entries, query]);

  return (
    <div>
      <label htmlFor="research-entry-search" className="label-caps block mb-2">
        Existing research entry
        <span className="text-clay-muted"> *</span>
      </label>
      <p className="type-infill mb-4 text-charcoal-muted">
        Search by title, year, or category.
      </p>

      <input
        id="research-entry-search"
        type="search"
        value={query}
        placeholder="Search research…"
        onChange={(event) => setQuery(event.target.value)}
        className="w-full bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200"
      />

      {selected && (
        <div className="hairline-border mt-4 p-4 bg-concrete-dark/40">
          <p className="label-caps mb-1 text-clay">Selected</p>
          <p className="type-body">{selected.title}</p>
          <p className="type-infill mt-1">
            {selected.year} · {selected.category}
          </p>
          <button
            type="button"
            className="action-secondary mt-3"
            onClick={() => onChange("")}
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="mt-4 max-h-56 overflow-y-auto hairline-border divide-y divide-hairline">
        {isLoading && (
          <p className="p-4 type-infill text-charcoal-muted">Loading entries…</p>
        )}
        {loadError && (
          <p className="p-4 type-infill text-clay" role="alert">
            {loadError}
          </p>
        )}
        {!isLoading && !loadError && filtered.length === 0 && (
          <p className="p-4 type-infill text-charcoal-muted">
            No matching research entries.
          </p>
        )}
        {!isLoading &&
          !loadError &&
          filtered.map((entry) => {
            const isSelected = entry.id === value;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onChange(entry.id, entry)}
                className={`block w-full p-4 text-left transition-colors duration-200 ${
                  isSelected
                    ? "bg-concrete-dark"
                    : "bg-concrete hover:bg-concrete-dark/60"
                }`}
              >
                <p className="type-body">{entry.title}</p>
                <p className="type-infill mt-1 text-charcoal-muted">
                  {entry.year} · {entry.category}
                </p>
              </button>
            );
          })}
      </div>

      {error && (
        <p className="type-infill mt-2 text-clay" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
