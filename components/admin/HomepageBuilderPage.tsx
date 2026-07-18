"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FormField } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { useToast } from "@/components/feedback/ToastProvider";
import { useAdminResource } from "@/hooks/useAdminResource";
import {
  getCtaDestinations,
  getJumpLinkDestinations,
  type PageDestination,
} from "@/lib/admin/pageDestinations";
import { toFriendlyAdminError } from "@/lib/admin/friendly";
import {
  createHomeSection,
  deleteHomeSection,
  getHomePage,
  reorderHomeSections,
  resetHomePage,
  updateHomeSection,
} from "@/lib/api/homepage";
import { getSiteSettings } from "@/lib/api/settings";
import type { HomeSection, HomeSectionType, NavLinkItem } from "@/lib/api/types";

const SECTION_TYPES: { value: HomeSectionType; label: string }[] = [
  { value: "hero", label: "Hero" },
  { value: "philosophy", label: "Philosophy" },
  { value: "portfolio", label: "Portfolio" },
  { value: "courses", label: "Courses" },
  { value: "products", label: "Products" },
  { value: "research", label: "Research" },
  { value: "contact", label: "Contact" },
  { value: "custom", label: "Custom" },
];

function text(content: Record<string, unknown>, key: string) {
  const value = content[key];
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function defaultContent(type: HomeSectionType): Record<string, unknown> {
  switch (type) {
    case "hero":
      return {
        tagline: "",
        headline: "",
        body: "",
        primaryCtaLabel: "View portfolio",
        primaryCtaHref: "/portfolio",
        secondaryCtaLabel: "Browse courses",
        secondaryCtaHref: "/courses",
        heroImageUrl: "",
        floorPlanLabel: "Floor plan",
        jumpLinks: [],
      };
    case "philosophy":
      return {
        roomLabel: "ROOM — PHILOSOPHY",
        roomNumber: "01",
        quote: "",
        attribution: "",
      };
    case "custom":
      return {
        roomLabel: "",
        roomNumber: "",
        eyebrow: "",
        title: "",
        body: "",
        href: "",
        linkLabel: "",
        anchorId: "",
      };
    default:
      return {
        roomLabel: "",
        roomNumber: "",
        eyebrow: "",
        title: "",
        href: "",
        linkLabel: "",
        thresholdLabel: "",
        featuredLimit: 3,
        body: "",
        ctaLabel: "",
      };
  }
}

function PageSelect({
  id,
  label,
  value,
  options,
  emptyLabel = "Select a page",
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: PageDestination[];
  emptyLabel?: string;
  onChange: (value: string) => void;
}) {
  const known = options.some((option) => option.value === value);
  const merged = known || !value
    ? options
    : [...options, { label: `Current · ${value}`, value }];

  return (
    <FormField
      id={id}
      name={id}
      label={label}
      type="select"
      value={value}
      options={merged}
      emptyLabel={emptyLabel}
      onChange={onChange}
    />
  );
}

function JumpLinksEditor({
  sectionId,
  links,
  destinations,
  onChange,
}: {
  sectionId: string;
  links: Array<{ href?: string; label?: string }>;
  destinations: PageDestination[];
  onChange: (links: Array<{ href: string; label: string }>) => void;
}) {
  const [open, setOpen] = useState(false);
  const rows = links.map((link) => ({
    href: typeof link.href === "string" ? link.href : "",
    label: typeof link.label === "string" ? link.label : "",
  }));

  function updateRow(
    index: number,
    patch: Partial<{ href: string; label: string }>
  ) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  const summary =
    rows.length === 0
      ? "No links yet"
      : rows
          .map((row) => row.label || "Untitled")
          .filter(Boolean)
          .join(" · ");

  return (
    <div className="md:col-span-2 space-y-3 border border-hairline p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="label-caps">Floor plan links</p>
          <p className="type-infill mt-2 truncate text-charcoal-muted">
            {summary}
          </p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-compact shrink-0"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
        >
          {open ? "Done" : "Edit Floor plan links"}
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-hairline pt-4">
          <div className="flex justify-end">
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-compact"
              onClick={() =>
                onChange([...rows, { label: "New link", href: "/portfolio" }])
              }
            >
              Add link
            </button>
          </div>

          {rows.length === 0 && (
            <p className="type-infill text-charcoal-muted">
              No floor plan links yet.
            </p>
          )}

          {rows.map((row, index) => (
            <div
              key={`${sectionId}-jump-${index}`}
              className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end border border-hairline p-3"
            >
              <FormField
                id={`${sectionId}-jump-label-${index}`}
                name="jumpLabel"
                label="Link text"
                value={row.label}
                onChange={(value) => updateRow(index, { label: value })}
              />
              <PageSelect
                id={`${sectionId}-jump-page-${index}`}
                label="Goes to"
                value={row.href}
                options={destinations}
                onChange={(value) => updateRow(index, { href: value })}
              />
              <button
                type="button"
                className="admin-btn admin-btn-danger admin-btn-compact mb-1"
                onClick={() => onChange(rows.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionFields({
  section,
  onChange,
  pageOptions,
  jumpOptions,
}: {
  section: HomeSection;
  onChange: (content: Record<string, unknown>) => void;
  pageOptions: PageDestination[];
  jumpOptions: PageDestination[];
}) {
  const c = section.content ?? {};
  const set = (key: string, value: string | number) =>
    onChange({ ...c, [key]: value });

  if (section.type === "hero") {
    const jumpLinks = Array.isArray(c.jumpLinks)
      ? (c.jumpLinks as Array<{ href?: string; label?: string }>)
      : [];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField
          id={`${section.id}-tagline`}
          name="tagline"
          label="Tagline"
          value={text(c, "tagline")}
          onChange={(value) => set("tagline", value)}
        />
        <FormField
          id={`${section.id}-headline`}
          name="headline"
          label="Headline"
          value={text(c, "headline")}
          onChange={(value) => set("headline", value)}
        />
        <FormField
          id={`${section.id}-body`}
          name="body"
          label="Introduction"
          type="textarea"
          rows={4}
          value={text(c, "body")}
          onChange={(value) => set("body", value)}
        />
        <FormField
          id={`${section.id}-floorPlanLabel`}
          name="floorPlanLabel"
          label="Floor plan heading"
          value={text(c, "floorPlanLabel")}
          onChange={(value) => set("floorPlanLabel", value)}
        />
        <FormField
          id={`${section.id}-primaryCtaLabel`}
          name="primaryCtaLabel"
          label="Primary button text"
          value={text(c, "primaryCtaLabel")}
          onChange={(value) => set("primaryCtaLabel", value)}
        />
        <PageSelect
          id={`${section.id}-primaryCtaHref`}
          label="Primary button page"
          value={text(c, "primaryCtaHref")}
          options={pageOptions}
          onChange={(value) => set("primaryCtaHref", value)}
        />
        <FormField
          id={`${section.id}-secondaryCtaLabel`}
          name="secondaryCtaLabel"
          label="Secondary button text"
          value={text(c, "secondaryCtaLabel")}
          onChange={(value) => set("secondaryCtaLabel", value)}
        />
        <PageSelect
          id={`${section.id}-secondaryCtaHref`}
          label="Secondary button page"
          value={text(c, "secondaryCtaHref")}
          options={pageOptions}
          onChange={(value) => set("secondaryCtaHref", value)}
        />
        <div className="md:col-span-2 space-y-3">
          <ImageUploadField
            label="Hero image"
            description="Upload a photo from your computer. Leave empty to keep the default portrait."
            value={text(c, "heroImageUrl")}
            onChange={(value) => set("heroImageUrl", value)}
          />
          {text(c, "heroImageUrl") && (
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-compact"
              onClick={() => set("heroImageUrl", "")}
            >
              Remove image
            </button>
          )}
        </div>
        <JumpLinksEditor
          sectionId={section.id}
          links={jumpLinks}
          destinations={jumpOptions}
          onChange={(links) => onChange({ ...c, jumpLinks: links })}
        />
      </div>
    );
  }

  if (section.type === "philosophy") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField
          id={`${section.id}-roomLabel`}
          name="roomLabel"
          label="Section doorway title"
          value={text(c, "roomLabel")}
          onChange={(value) => set("roomLabel", value)}
        />
        <FormField
          id={`${section.id}-roomNumber`}
          name="roomNumber"
          label="Section number"
          value={text(c, "roomNumber")}
          onChange={(value) => set("roomNumber", value)}
        />
        <FormField
          id={`${section.id}-quote`}
          name="quote"
          label="Quote"
          type="textarea"
          rows={4}
          value={text(c, "quote")}
          onChange={(value) => set("quote", value)}
        />
        <FormField
          id={`${section.id}-attribution`}
          name="attribution"
          label="Quoted by"
          value={text(c, "attribution")}
          onChange={(value) => set("attribution", value)}
        />
      </div>
    );
  }

  if (
    ["portfolio", "courses", "products", "research", "contact", "custom"].includes(
      section.type
    )
  ) {
    const showFeatured = !["contact", "custom"].includes(section.type);
    const showThreshold = !["contact", "custom"].includes(section.type);
    const showBody = ["contact", "custom"].includes(section.type);
    const showButtonText = section.type === "contact";
    const showSectionId = section.type === "custom";

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField
          id={`${section.id}-roomLabel`}
          name="roomLabel"
          label="Section doorway title"
          value={text(c, "roomLabel")}
          onChange={(value) => set("roomLabel", value)}
        />
        <FormField
          id={`${section.id}-roomNumber`}
          name="roomNumber"
          label="Section number"
          value={text(c, "roomNumber")}
          onChange={(value) => set("roomNumber", value)}
        />
        <FormField
          id={`${section.id}-eyebrow`}
          name="eyebrow"
          label="Small heading"
          value={text(c, "eyebrow")}
          onChange={(value) => set("eyebrow", value)}
        />
        <FormField
          id={`${section.id}-title`}
          name="title"
          label="Title"
          value={text(c, "title")}
          onChange={(value) => set("title", value)}
        />
        <FormField
          id={`${section.id}-linkLabel`}
          name="linkLabel"
          label="Button text"
          value={text(c, "linkLabel")}
          onChange={(value) => set("linkLabel", value)}
        />
        <PageSelect
          id={`${section.id}-href`}
          label="Button page"
          value={text(c, "href")}
          options={pageOptions}
          emptyLabel="Select a page"
          onChange={(value) => set("href", value)}
        />
        {showThreshold && (
          <FormField
            id={`${section.id}-thresholdLabel`}
            name="thresholdLabel"
            label="Frame title"
            value={text(c, "thresholdLabel")}
            onChange={(value) => set("thresholdLabel", value)}
          />
        )}
        {showFeatured && (
          <FormField
            id={`${section.id}-featuredLimit`}
            name="featuredLimit"
            label="How many items to show (0 = all)"
            value={text(c, "featuredLimit")}
            onChange={(value) => set("featuredLimit", Number(value) || 0)}
          />
        )}
        {showBody && (
          <FormField
            id={`${section.id}-body`}
            name="body"
            label="Body text"
            type="textarea"
            rows={4}
            value={text(c, "body")}
            onChange={(value) => set("body", value)}
          />
        )}
        {showButtonText && (
          <FormField
            id={`${section.id}-ctaLabel`}
            name="ctaLabel"
            label="Main button text"
            value={text(c, "ctaLabel")}
            onChange={(value) => set("ctaLabel", value)}
          />
        )}
        {showSectionId && (
          <FormField
            id={`${section.id}-anchorId`}
            name="anchorId"
            label="Section name on page"
            value={text(c, "anchorId")}
            placeholder="e.g. studio"
            onChange={(value) => set("anchorId", value)}
          />
        )}
      </div>
    );
  }

  return null;
}

export function HomepageBuilderPage() {
  const loader = useCallback(() => getHomePage(), []);
  const { data, setData, isLoading, error, refetch } =
    useAdminResource(loader);
  const { success, error: toastError, neutral } = useToast();
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [addType, setAddType] = useState<HomeSectionType>("custom");
  const [navItems, setNavItems] = useState<NavLinkItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    getSiteSettings()
      .then((settings) => {
        if (!cancelled) setNavItems(settings.navigation?.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setNavItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pageOptions = getCtaDestinations(navItems);
  const jumpOptions = getJumpLinkDestinations(navItems);

  const sections = [...(data?.sections ?? [])].sort(
    (a, b) => a.order - b.order
  );

  async function persistReorder(next: HomeSection[]) {
    setData(data ? { ...data, sections: next } : data);
    setBusy(true);
    try {
      const saved = await reorderHomeSections(next.map((s) => s.id));
      setData(saved);
    } catch (err) {
      toastError(toFriendlyAdminError(err, "reorder homepage sections"));
      await refetch();
    } finally {
      setBusy(false);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const nextIndex = index + dir;
    if (nextIndex < 0 || nextIndex >= sections.length) return;
    const next = [...sections];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    void persistReorder(next.map((s, order) => ({ ...s, order: order + 1 })));
  }

  async function toggleEnabled(section: HomeSection) {
    setBusy(true);
    try {
      const saved = await updateHomeSection(section.id, {
        enabled: !section.enabled,
      });
      setData(saved);
      success(section.enabled ? "Section hidden" : "Section shown");
    } catch (err) {
      toastError(toFriendlyAdminError(err, "update section"));
    } finally {
      setBusy(false);
    }
  }

  async function saveSection(section: HomeSection) {
    setBusy(true);
    try {
      const saved = await updateHomeSection(section.id, {
        content: section.content,
        type: section.type,
        enabled: section.enabled,
      });
      setData(saved);
      setEditingId(null);
      success("Section saved");
    } catch (err) {
      toastError(toFriendlyAdminError(err, "save section"));
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd() {
    setBusy(true);
    try {
      const saved = await createHomeSection({
        type: addType,
        enabled: true,
        content: defaultContent(addType),
      });
      setData(saved);
      const created = saved.sections[saved.sections.length - 1];
      if (created) setEditingId(created.id);
      success("Section added");
    } catch (err) {
      toastError(toFriendlyAdminError(err, "add section"));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setBusy(true);
    try {
      const saved = await deleteHomeSection(deleteId);
      setData(saved);
      setDeleteId(null);
      if (editingId === deleteId) setEditingId(null);
      neutral("Section deleted");
    } catch (err) {
      toastError(toFriendlyAdminError(err, "delete section"));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setResetOpen(false);
    setBusy(true);
    try {
      const saved = await resetHomePage();
      setData(saved);
      setEditingId(null);
      neutral("Homepage reset to defaults");
    } catch (err) {
      toastError(toFriendlyAdminError(err, "reset homepage"));
    } finally {
      setBusy(false);
    }
  }

  function patchSection(id: string, patch: Partial<HomeSection>) {
    if (!data) return;
    setData({
      ...data,
      sections: data.sections.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    });
  }

  if (isLoading) return <AdminLoader label="Loading homepage" />;
  if (error) {
    return (
      <AdminErrorState
        title="Could not load homepage"
        message={error}
        onRetry={refetch}
      />
    );
  }

  const editing = sections.find((s) => s.id === editingId) ?? null;

  return (
    <div>
      <AdminPageHeader
        eyebrow="CMS-02"
        title="Homepage builder"
        description="Reorder rooms, edit copy and CTAs, show or hide sections, and add custom content blocks."
        action={
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => setResetOpen(true)}
            disabled={busy}
          >
            Reset homepage
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-8 items-stretch sm:items-end">
        <div className="flex-1 max-w-xs">
          <FormField
            id="add-type"
            name="type"
            label="Add section type"
            type="select"
            value={addType}
            options={SECTION_TYPES}
            onChange={(value) => setAddType(value as HomeSectionType)}
          />
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={handleAdd}
          disabled={busy}
        >
          Add section
        </button>
      </div>

      <div className="space-y-3 max-w-4xl">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`border border-hairline bg-concrete p-4 ${
              section.enabled ? "" : "opacity-60"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="label-caps text-clay">
                  {String(index + 1).padStart(2, "0")} · {section.type}
                </p>
                <p className="type-title mt-1 truncate">
                  {text(section.content, "title") ||
                    text(section.content, "headline") ||
                    text(section.content, "roomLabel") ||
                    section.id}
                </p>
                <p className="label-caps mt-1 text-charcoal-infill">
                  {section.enabled ? "Visible" : "Hidden"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-compact"
                  onClick={() => move(index, -1)}
                  disabled={busy || index === 0}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-compact"
                  onClick={() => move(index, 1)}
                  disabled={busy || index === sections.length - 1}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-compact"
                  onClick={() => toggleEnabled(section)}
                  disabled={busy}
                >
                  {section.enabled ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-compact"
                  onClick={() =>
                    setEditingId(editingId === section.id ? null : section.id)
                  }
                >
                  {editingId === section.id ? "Close" : "Edit"}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-danger admin-btn-compact"
                  onClick={() => setDeleteId(section.id)}
                  disabled={busy}
                >
                  Delete
                </button>
              </div>
            </div>

            {editing && editing.id === section.id && (
              <div className="mt-6 pt-6 hairline-t space-y-4">
                <SectionFields
                  section={editing}
                  pageOptions={pageOptions}
                  jumpOptions={jumpOptions}
                  onChange={(content) =>
                    patchSection(section.id, { content })
                  }
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => saveSection(editing)}
                  disabled={busy}
                >
                  Save section
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete section?"
        message="This removes the section from the homepage. You can reset to restore the default layout."
        confirmLabel="Delete"
        confirmTone="danger"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={resetOpen}
        title="Reset homepage?"
        message="This restores the default room order and copy."
        confirmLabel="Reset"
        confirmTone="danger"
        onCancel={() => setResetOpen(false)}
        onConfirm={handleReset}
      />
    </div>
  );
}
