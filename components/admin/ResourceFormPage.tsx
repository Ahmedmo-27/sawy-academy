"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { CoursePickerField } from "@/components/admin/CoursePickerField";
import { FormField } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { LessonsManager } from "@/components/admin/LessonsManager";
import {
  resourceConfigs,
  type ResourceField,
  type ResourceForm,
  type ResourceKind,
  type ResourceRecord,
} from "@/components/admin/resourceConfig";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import {
  cacheAdminRecord,
  readCachedAdminRecord,
  toFriendlyAdminError,
} from "@/lib/admin/friendly";
import { useToast } from "@/components/feedback/ToastProvider";
import type { Course } from "@/lib/api/types";

interface ResourceFormPageProps {
  kind: ResourceKind;
  lookupKey?: string;
}

function recordLabelFromForm(form: ResourceForm, record: ResourceRecord | null) {
  const formTitle = form.title?.trim();
  const formName = form.name?.trim();
  if (formTitle) return formTitle;
  if (formName) return formName;
  if (record) {
    const title = record.title;
    const name = record.name;
    if (typeof title === "string" && title.trim()) return title;
    if (typeof name === "string" && name.trim()) return name;
  }
  return "this item";
}

function deleteMessage(kind: ResourceKind, label: string) {
  if (kind === "courses") {
    // TODO: Fetch active enrollment count from the API and surface it here
    // (e.g. "This course has N active enrollments") before confirming delete.
    return `Delete “${label}”? This can't be undone. If students are enrolled, deleting will affect their access — enrollment count is not yet checked against the API.`;
  }
  return `Delete “${label}”? This can't be undone.`;
}

function validateField(field: ResourceField, value: string) {
  if (field.required && !value.trim()) {
    return `Please enter ${field.label.toLowerCase()}.`;
  }

  if (field.type === "number" && value && Number.isNaN(Number(value))) {
    return `${field.label} must be a number.`;
  }

  return "";
}

export function ResourceFormPage({ kind, lookupKey }: ResourceFormPageProps) {
  const config = resourceConfigs[kind];
  const router = useRouter();
  const { success, error: toastError, neutral } = useToast();
  const isEdit = Boolean(lookupKey);
  const [form, setForm] = useState<ResourceForm>(config.emptyForm);
  const [record, setRecord] = useState<ResourceRecord | null>(null);
  const [fields, setFields] = useState<ResourceField[]>(config.fields);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadRecord = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const resolvedFields = await Promise.all(
        config.fields.map(async (field) => {
          if (!field.optionsLoader) return field;
          try {
            return {
              ...field,
              options: await field.optionsLoader(),
            };
          } catch {
            return field;
          }
        })
      );
      setFields(resolvedFields);

      if (!lookupKey) {
        setForm(config.emptyForm);
        return;
      }

      const cached = readCachedAdminRecord(kind, lookupKey);
      if (cached) {
        setRecord(cached);
        setForm(config.toForm(cached));
      }

      try {
        const nextRecord = await config.get(lookupKey);
        setRecord(nextRecord);
        setForm(config.toForm(nextRecord));
        cacheAdminRecord(kind, lookupKey, nextRecord);
      } catch (err) {
        if (cached) {
          // Keep the cached form so the editor stays usable.
          return;
        }
        throw err;
      }
    } catch (err) {
      setLoadError(toFriendlyAdminError(err, "open this page"));
    } finally {
      setIsLoading(false);
    }
  }, [config, kind, lookupKey]);

  useEffect(() => {
    void loadRecord();
  }, [loadRecord]);

  function updateForm(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const message = validateField(field, form[field.name] ?? "");
      if (message) nextErrors[field.name] = message;
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setSaveError("");

    try {
      const saved =
        isEdit && lookupKey
          ? await config.update(lookupKey, form)
          : await config.create(form);

      const key = config.getKey(saved);
      if (key) cacheAdminRecord(kind, key, saved);
      success(isEdit ? "Changes saved" : "Created successfully");
      router.push(config.getEditHref(saved));
    } catch (err) {
      const message = toFriendlyAdminError(err, "save your changes");
      setSaveError(message);
      toastError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!lookupKey) return;

    setIsSaving(true);
    setSaveError("");

    try {
      await config.remove(lookupKey);
      neutral("Deleted");
      router.push(config.basePath);
    } catch (err) {
      const message = toFriendlyAdminError(err, "delete this item");
      setSaveError(message);
      toastError(message);
    } finally {
      setIsSaving(false);
      setDeleteOpen(false);
    }
  }

  if (isLoading) {
    return <AdminLoader label="Loading…" />;
  }

  if (loadError) {
    return (
      <AdminErrorState
        title="We couldn't open this page"
        message={loadError}
        backHref={config.basePath}
        backLabel={`Back to ${config.title.toLowerCase()}`}
        onRetry={() => void loadRecord()}
      />
    );
  }

  return (
    <div className="space-y-10">
      <AdminPageHeader
        eyebrow={config.eyebrow}
        title={isEdit ? `Edit ${config.title.replace(/s$/, "")}` : `Add ${config.title.replace(/s$/, "").toLowerCase()}`}
        description="Fill in the details below, then click Save."
        action={
          <Link href={config.basePath} className="admin-btn admin-btn-secondary">
            Back to list
          </Link>
        }
      />

      <ThresholdFrame label="DETAILS">
        <form
          className="hairline-border bg-concrete p-6 lg:p-8"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-6 md:grid-cols-2">
            {fields.map((field) => {
              if (field.type === "upload") {
                return (
                  <div key={field.name} className="md:col-span-2">
                    <ImageUploadField
                      label={field.label}
                      value={form[field.name] ?? ""}
                      required={field.required}
                      error={errors[field.name]}
                      onChange={(value) => updateForm(field.name, value)}
                    />
                    {field.hint && !errors[field.name] && (
                      <p className="type-infill mt-2 text-charcoal-muted">
                        {field.hint}
                      </p>
                    )}
                  </div>
                );
              }

              if (field.type === "course-picker") {
                return (
                  <CoursePickerField
                    key={field.name}
                    label={field.label}
                    value={form[field.name] ?? ""}
                    error={errors[field.name]}
                    onChange={(value) => updateForm(field.name, value)}
                  />
                );
              }

              return (
                <div
                  key={field.name}
                  className={field.type === "textarea" ? "md:col-span-2" : ""}
                >
                  <FormField
                    id={`${kind}-${field.name}`}
                    name={field.name}
                    label={field.label}
                    type={field.type}
                    value={form[field.name] ?? ""}
                    required={field.required}
                    options={field.options}
                    error={errors[field.name]}
                    onChange={(value) => updateForm(field.name, value)}
                  />
                  {field.hint && !errors[field.name] && (
                    <p className="type-infill mt-2 text-charcoal-muted">
                      {field.hint}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {saveError && (
            <p className="type-body mt-6 text-clay">{saveError}</p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
            <Link
              href={config.basePath}
              className="admin-btn admin-btn-secondary"
            >
              Cancel
            </Link>
            {isEdit && (
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </ThresholdFrame>

      {kind === "courses" && isEdit && lookupKey && record && (
        <ThresholdFrame label="LESSONS">
          <div className="hairline-border bg-concrete p-6 lg:p-8">
            {typeof record.groupTitle === "string" && record.groupTitle && (
              <p className="label-caps mb-6 text-clay">
                Group — {record.groupTitle}
              </p>
            )}
            <LessonsManager
              courseSlug={lookupKey}
              lessons={(record as unknown as Course).lessons ?? []}
            />
          </div>
        </ThresholdFrame>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title={`Delete ${recordLabelFromForm(form, record)}?`}
        message={deleteMessage(kind, recordLabelFromForm(form, record))}
        confirmLabel="Delete"
        isBusy={isSaving}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
