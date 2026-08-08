"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
}

export interface DataTableFilter<T> {
  key: string;
  label: string;
  options: Array<{ label: string; value: string }>;
  getValue: (row: T) => string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  /** Enable drag-handle reordering. Indices are absolute within `data`. */
  onReorder?: (fromIndex: number, toIndex: number) => void;
  reorderDisabled?: boolean;
  searchPlaceholder?: string;
  getSearchText?: (row: T) => string;
  filters?: DataTableFilter<T>[];
}

function DragHandleIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="4" cy="3" r="1.25" />
      <circle cx="10" cy="3" r="1.25" />
      <circle cx="4" cy="7" r="1.25" />
      <circle cx="10" cy="7" r="1.25" />
      <circle cx="4" cy="11" r="1.25" />
      <circle cx="10" cy="11" r="1.25" />
    </svg>
  );
}

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  emptyMessage,
  pageSize = 10,
  onRowClick,
  onReorder,
  reorderDisabled = false,
  searchPlaceholder = "Search records",
  getSearchText,
  filters = [],
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const canReorder = Boolean(onReorder);
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState("");
  const searchId = useId();

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return data.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        (getSearchText?.(row) ?? "")
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      const matchesFilters = filters.every((filter) => {
        const selected = filterValues[filter.key];
        return !selected || filter.getValue(row) === selected;
      });
      return matchesQuery && matchesFilters;
    });
  }, [data, filterValues, filters, getSearchText, query]);

  const sorted = useMemo(() => {
    if (!sortKey || canReorder) return filtered;

    const column = columns.find((item) => item.key === sortKey);
    if (!column) return filtered;

    return [...filtered].sort((a, b) => {
      const aValue = column.sortValue?.(a) ?? String(column.render(a) ?? "");
      const bValue = column.sortValue?.(b) ?? String(column.render(b) ?? "");

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return sortDirection === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [canReorder, columns, filtered, sortDirection, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageOffset = (currentPage - 1) * pageSize;
  const paged = sorted.slice(pageOffset, pageOffset + pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, filterValues]);

  useEffect(() => {
    if (!sortKey) return;
    const column = columns.find((item) => item.key === sortKey);
    if (column) {
      setAnnouncement(
        `Sorted by ${column.header}, ${sortDirection === "asc" ? "ascending" : "descending"}.`
      );
    }
  }, [columns, sortDirection, sortKey]);

  function handleSort(key: string) {
    setPage(1);
    setSortKey((current) => {
      if (current === key) {
        setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
        return current;
      }

      setSortDirection("asc");
      return key;
    });
  }

  function clearDragState() {
    dragIndexRef.current = null;
    setDragIndex(null);
    setOverIndex(null);
  }

  function commitReorder(toIndex: number, dataTransfer?: DataTransfer) {
    if (!onReorder || reorderDisabled) return;

    const fromData = dataTransfer?.getData("text/plain");
    const fromParsed =
      fromData !== undefined && fromData !== "" ? Number(fromData) : NaN;
    const from =
      dragIndexRef.current ??
      (Number.isFinite(fromParsed) ? fromParsed : null);

    if (from === null || from === toIndex) return;

    onReorder(from, toIndex);
  }

  return (
    <div className="space-y-3">
      {(getSearchText || filters.length > 0) && (
        <div className="hairline-border grid gap-3 bg-concrete-dark/30 p-3 sm:grid-cols-[minmax(12rem,1fr)_auto]">
          {getSearchText && (
            <div>
              <label htmlFor={searchId} className="sr-only">
                Search
              </label>
              <input
                id={searchId}
                type="search"
                value={query}
                placeholder={searchPlaceholder}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full border border-hairline bg-concrete px-3 py-2.5 type-body text-charcoal"
              />
            </div>
          )}
          {filters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <label key={filter.key} className="sr-only">
                  {filter.label}
                  <select
                    value={filterValues[filter.key] ?? ""}
                    onChange={(event) =>
                      setFilterValues((current) => ({
                        ...current,
                        [filter.key]: event.target.value,
                      }))
                    }
                    className="not-sr-only border border-hairline bg-concrete px-3 py-2.5 type-body text-charcoal"
                  >
                    <option value="">All {filter.label.toLowerCase()}</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="dim-label" aria-live="polite">
          {sorted.length} {sorted.length === 1 ? "result" : "results"}
          {sorted.length !== data.length ? ` of ${data.length}` : ""}
        </p>
        {(query || Object.values(filterValues).some(Boolean)) && (
          <button
            type="button"
            className="admin-btn admin-btn-secondary admin-btn-compact"
            onClick={() => {
              setQuery("");
              setFilterValues({});
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">{announcement}</p>

      {data.length === 0 || sorted.length === 0 ? (
        <AdminEmptyState
          message={
            data.length === 0
              ? emptyMessage
              : "No records match the current search and filters."
          }
        />
      ) : (
      <div className="hairline-border overflow-hidden bg-concrete">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[48rem] border-collapse">
          <thead>
            <tr className="bg-concrete-dark/70">
              {canReorder && (
                <th
                  scope="col"
                  className="w-12 px-2 py-4 text-left label-caps text-charcoal"
                >
                  <span className="sr-only">Reorder</span>
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    sortKey === column.key
                      ? sortDirection === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className={`px-4 py-4 text-left label-caps text-charcoal ${
                    column.className ?? ""
                  }`}
                >
                  {column.sortable && !canReorder ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary admin-btn-compact w-full justify-start border-transparent bg-transparent px-0 hover:border-hairline hover:bg-concrete"
                      onClick={() => handleSort(column.key)}
                    >
                      {column.header}
                      {sortKey === column.key && (
                        <span className="ml-2 text-clay">
                          {sortDirection === "asc" ? "ASC" : "DESC"}
                        </span>
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, localIndex) => {
              const absoluteIndex = pageOffset + localIndex;
              const isDragging = dragIndex === absoluteIndex;
              const isDropTarget =
                overIndex === absoluteIndex &&
                dragIndex !== null &&
                dragIndex !== absoluteIndex;

              return (
                <tr
                  key={getRowKey(row)}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={`hairline-t transition-colors duration-200 ${
                    onRowClick
                      ? "cursor-pointer hover:bg-concrete-dark/40 focus-visible:bg-concrete-dark/40"
                      : ""
                  } ${isDragging ? "opacity-40" : ""} ${
                    isDropTarget ? "bg-clay/10" : ""
                  }`}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={(event) => {
                    if (!onRowClick) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  onDragOver={(event) => {
                    if (!canReorder || dragIndexRef.current === null) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setOverIndex((current) =>
                      current === absoluteIndex ? current : absoluteIndex
                    );
                  }}
                  onDrop={(event) => {
                    if (!canReorder) return;
                    event.preventDefault();
                    event.stopPropagation();
                    commitReorder(absoluteIndex, event.dataTransfer);
                    clearDragState();
                  }}
                >
                  {canReorder && (
                    <td className="w-12 px-2 py-5 align-middle">
                      <div className="flex items-center gap-1">
                      <button
                        type="button"
                        draggable={!reorderDisabled}
                        aria-label={`Drag row ${absoluteIndex + 1} to reorder`}
                        title="Drag to reorder"
                        disabled={reorderDisabled}
                        className="admin-btn admin-btn-secondary admin-btn-compact cursor-grab touch-none px-2 active:cursor-grabbing disabled:cursor-not-allowed"
                        onClick={(event) => event.stopPropagation()}
                        onDragStart={(event) => {
                          event.stopPropagation();
                          dragIndexRef.current = absoluteIndex;
                          setDragIndex(absoluteIndex);
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData(
                            "text/plain",
                            String(absoluteIndex)
                          );
                          const rowEl = event.currentTarget.closest("tr");
                          if (rowEl) {
                            event.dataTransfer.setDragImage(rowEl, 24, 24);
                          }
                        }}
                        onDragEnd={() => {
                          // Defer so `drop` can still read the drag index first.
                          window.setTimeout(clearDragState, 0);
                        }}
                      >
                        <DragHandleIcon />
                      </button>
                      <span className="flex flex-col">
                        <button
                          type="button"
                          className="px-1 text-xs disabled:opacity-30"
                          aria-label={`Move row ${absoluteIndex + 1} up`}
                          disabled={reorderDisabled || absoluteIndex === 0}
                          onClick={(event) => {
                            event.stopPropagation();
                            onReorder?.(absoluteIndex, absoluteIndex - 1);
                          }}
                        >↑</button>
                        <button
                          type="button"
                          className="px-1 text-xs disabled:opacity-30"
                          aria-label={`Move row ${absoluteIndex + 1} down`}
                          disabled={reorderDisabled || absoluteIndex === data.length - 1}
                          onClick={(event) => {
                            event.stopPropagation();
                            onReorder?.(absoluteIndex, absoluteIndex + 1);
                          }}
                        >↓</button>
                      </span>
                      </div>
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`admin-table-cell px-4 py-5 align-middle ${
                        column.className ?? ""
                      }`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-hairline md:hidden">
        {paged.map((row, localIndex) => {
          const absoluteIndex = pageOffset + localIndex;
          return (
            <li
              key={getRowKey(row)}
              className={onRowClick ? "cursor-pointer p-4 hover:bg-concrete-dark/40" : "p-4"}
              onClick={() => onRowClick?.(row)}
            >
              <dl className="space-y-3">
                {columns.map((column) => (
                  <div key={column.key} className="grid grid-cols-[7rem_1fr] gap-3">
                    <dt className="label-caps text-charcoal-infill">{column.header}</dt>
                    <dd className="min-w-0 type-body">{column.render(row)}</dd>
                  </div>
                ))}
              </dl>
              {canReorder && (
                <div className="mt-4 flex gap-2" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary admin-btn-compact"
                    disabled={reorderDisabled || absoluteIndex === 0}
                    onClick={() => onReorder?.(absoluteIndex, absoluteIndex - 1)}
                  >Move up</button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary admin-btn-compact"
                    disabled={reorderDisabled || absoluteIndex === data.length - 1}
                    onClick={() => onReorder?.(absoluteIndex, absoluteIndex + 1)}
                  >Move down</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="hairline-t flex items-center justify-between gap-4 px-4 py-4">
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-compact"
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <p className="dim-label">
          Sheet {String(currentPage).padStart(2, "0")} /{" "}
          {String(pageCount).padStart(2, "0")}
        </p>
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-compact"
          onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
          disabled={currentPage === pageCount}
        >
          Next
        </button>
      </div>
      </div>
      )}
    </div>
  );
}

export function DataTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="hairline-border space-y-px bg-hairline" aria-label="Loading records">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="grid grid-cols-3 gap-4 bg-concrete p-4" aria-hidden="true">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2 justify-self-end" />
        </div>
      ))}
      <span className="sr-only">Loading records</span>
    </div>
  );
}
