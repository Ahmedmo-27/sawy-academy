"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable, DataTableSkeleton } from "@/components/admin/DataTable";
import {
  resourceConfigs,
  type ResourceKind,
  type ResourceRecord,
} from "@/components/admin/resourceConfig";
import {
  cacheAdminRecord,
  toFriendlyAdminError,
} from "@/lib/admin/friendly";
import { useAdminResource } from "@/hooks/useAdminResource";
import { useToast } from "@/components/feedback/ToastProvider";

interface ResourceListPageProps {
  kind: ResourceKind;
}

function recordLabel(record: ResourceRecord) {
  const title = record.title;
  const name = record.name;
  const question = record.question;
  if (typeof title === "string" && title.trim()) return title;
  if (typeof name === "string" && name.trim()) return name;
  if (typeof question === "string" && question.trim()) return question;
  return "this item";
}

function deleteMessage(kind: ResourceKind, label: string) {
  if (kind === "courses") {
    // TODO: Fetch active enrollment count from the API and surface it here
    // (e.g. "This course has N active enrollments") before confirming delete.
    return `Delete “${label}”? This can't be undone. Deleting a course may remove access for enrolled students, and their current number is not available here.`;
  }
  return `Delete “${label}”? This can't be undone.`;
}

function moveRecord(
  records: ResourceRecord[],
  fromIndex: number,
  toIndex: number
) {
  const next = [...records];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next.map((record, order) => ({
    ...record,
    order: order + 1,
  }));
}

export function ResourceListPage({ kind }: ResourceListPageProps) {
  const config = resourceConfigs[kind];
  const router = useRouter();
  const { error: toastError, neutral } = useToast();
  const loader = useCallback(() => config.list(), [config]);
  const { data, setData, isLoading, error, progress, stepLabel, refetch } =
    useAdminResource(loader);
  const [deleteTarget, setDeleteTarget] = useState<ResourceRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [actionError, setActionError] = useState("");
  const canReorder = Boolean(config.reorder);
  const rows = data ?? [];

  function openEdit(record: ResourceRecord) {
    const key = config.getKey(record);
    cacheAdminRecord(kind, key, record);
    router.push(config.getEditHref(record));
  }

  async function handleReorder(fromIndex: number, toIndex: number) {
    if (!config.reorder || isReordering || fromIndex === toIndex) return;

    const previous = rows;
    const withOrder = moveRecord(rows, fromIndex, toIndex);

    setData(withOrder);
    setIsReordering(true);
    setActionError("");

    try {
      await config.reorder(withOrder.map(config.getKey));
      neutral("Order saved");
    } catch (err) {
      setData(previous);
      const message = toFriendlyAdminError(err, "reorder these items");
      setActionError(message);
      toastError(message);
    } finally {
      setIsReordering(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setActionError("");

    try {
      await config.remove(config.getKey(deleteTarget));
      setDeleteTarget(null);
      neutral("Deleted");
      await refetch();
    } catch (err) {
      const message = toFriendlyAdminError(err, "delete this item");
      setActionError(message);
      toastError(message);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const singular = config.title.replace(/s$/, "").toLowerCase();
  const deleteLabel = deleteTarget ? recordLabel(deleteTarget) : "";

  return (
    <div>
      <AdminPageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        guidance={`Use search to find an item, then choose “Open and edit”. Creating or editing ${config.listLabel} opens a separate page.`}
        action={
          <Link
            href={`${config.basePath}/new`}
            className="admin-btn admin-btn-primary"
          >
            Add new {singular}
          </Link>
        }
      />

      {actionError && (
        <p className="mb-6 type-body text-clay" role="alert">
          {actionError}
        </p>
      )}

      {isLoading && (
        <div>
          <p className="dim-label mb-3" role="status">
            {stepLabel || `Loading ${config.listLabel}`} · {Math.round(progress ?? 0)}%
          </p>
          <DataTableSkeleton />
        </div>
      )}
      {!isLoading && error && (
        <AdminErrorState
          title="We couldn't load this list"
          message={error}
          onRetry={() => void refetch()}
        />
      )}
      {!isLoading && !error && data && (
        <DataTable
          data={rows}
          getRowKey={config.getKey}
          pageSize={canReorder ? Math.max(rows.length, 1) : 10}
          onReorder={canReorder ? handleReorder : undefined}
          reorderDisabled={isReordering}
          searchPlaceholder={`Search ${config.listLabel}`}
          getSearchText={(record) =>
            Object.values(record)
              .filter((value) => typeof value === "string" || typeof value === "number")
              .join(" ")
          }
          emptyMessage={`No ${config.listLabel} yet. Choose “Add new ${singular}” to create the first one.`}
          columns={[
            ...config.listColumns.map((column) => ({
              key: column.key,
              header: column.header,
              sortable: !canReorder,
              className: column.className,
              sortValue: column.sortValue,
              render: column.value,
            })),
            {
              key: "actions",
              header: "Actions",
              className: "text-right whitespace-nowrap",
              render: (record) => (
                <div
                  className="flex flex-wrap justify-end gap-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary admin-btn-compact"
                    onClick={() => openEdit(record)}
                  >
                    Open and edit
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger admin-btn-compact"
                    onClick={() => setDeleteTarget(record)}
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteLabel}?`}
        message={deleteMessage(kind, deleteLabel)}
        confirmLabel="Delete"
        isBusy={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
