"use client";

import { useMemo, useRef, useState } from "react";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
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
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const canReorder = Boolean(onReorder);

  const sorted = useMemo(() => {
    if (!sortKey || canReorder) return data;

    const column = columns.find((item) => item.key === sortKey);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aValue = column.sortValue?.(a) ?? String(column.render(a) ?? "");
      const bValue = column.sortValue?.(b) ?? String(column.render(b) ?? "");

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return sortDirection === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [canReorder, columns, data, sortDirection, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageOffset = (currentPage - 1) * pageSize;
  const paged = sorted.slice(pageOffset, pageOffset + pageSize);

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

  if (data.length === 0) {
    return <AdminEmptyState message={emptyMessage} />;
  }

  return (
    <div className="hairline-border overflow-hidden bg-concrete">
      <div className="overflow-x-auto">
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
                      <button
                        type="button"
                        draggable={!reorderDisabled}
                        aria-label="Drag to reorder"
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
  );
}
