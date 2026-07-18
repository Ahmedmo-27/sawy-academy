"use client";

import { useCallback, useState } from "react";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FormField } from "@/components/admin/FormField";
import { useToast } from "@/components/feedback/ToastProvider";
import { useAdminResource } from "@/hooks/useAdminResource";
import { getMainPageDestinations } from "@/lib/admin/pageDestinations";
import { toFriendlyAdminError } from "@/lib/admin/friendly";
import {
  getSiteSettings,
  resetSiteSettings,
  updateSiteSettings,
} from "@/lib/api/settings";
import type { NavLinkItem, PageHeaderContent, SiteSettings } from "@/lib/api/types";
import { DEFAULT_SITE_SETTINGS } from "@/lib/branding";

const PAGE_KEYS = [
  "portfolio",
  "courses",
  "products",
  "researches",
  "services",
  "contact",
  "cart",
  "checkout",
  "login",
  "signup",
] as const;

const NAV_PAGE_OPTIONS = getMainPageDestinations();

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

function PageField({
  id,
  label,
  value,
  emptyLabel,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  emptyLabel: string;
  onChange: (value: string) => void;
}) {
  const known = NAV_PAGE_OPTIONS.some((option) => option.value === value);
  const options =
    known || !value
      ? NAV_PAGE_OPTIONS
      : [...NAV_PAGE_OPTIONS, { label: `Current · ${value}`, value }];

  return (
    <FormField
      id={id}
      name={id}
      label={label}
      type="select"
      value={value}
      options={options}
      emptyLabel={emptyLabel}
      onChange={onChange}
    />
  );
}

function LinkEditor({
  title,
  links,
  onChange,
  allowChildren = false,
}: {
  title: string;
  links: NavLinkItem[];
  onChange: (links: NavLinkItem[]) => void;
  allowChildren?: boolean;
}) {
  function updateLink(index: number, patch: Partial<NavLinkItem>) {
    onChange(
      links.map((link, i) => (i === index ? { ...link, ...patch } : link))
    );
  }

  function removeLink(index: number) {
    onChange(links.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= links.length) return;
    const copy = [...links];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onChange(copy);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="label-caps">{title}</p>
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-compact"
          onClick={() =>
            onChange([
              ...links,
              { id: newId("link"), label: "New link", href: "/" },
            ])
          }
        >
          Add link
        </button>
      </div>

      {links.map((link, index) => (
        <div
          key={link.id}
          className="border border-hairline bg-concrete p-4 space-y-3"
        >
          <div className="flex flex-wrap gap-2 justify-between">
            <p className="label-caps text-charcoal-infill">
              Item {index + 1}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-compact"
                onClick={() => move(index, -1)}
                disabled={index === 0}
              >
                Up
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-compact"
                onClick={() => move(index, 1)}
                disabled={index === links.length - 1}
              >
                Down
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger admin-btn-compact"
                onClick={() => removeLink(index)}
              >
                Remove
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              id={`${link.id}-label`}
              name="label"
              label="Link text"
              value={link.label}
              onChange={(value) => updateLink(index, { label: value })}
            />
            <PageField
              id={`${link.id}-page`}
              label="Goes to"
              value={link.href}
              emptyLabel={
                allowChildren ? "Menu only (opens submenu)" : "Select a page"
              }
              onChange={(value) => updateLink(index, { href: value })}
            />
          </div>

          {allowChildren && (
            <div className="pl-3 border-l border-hairline space-y-3">
              <div className="flex items-center justify-between">
                <p className="label-caps">Submenu links</p>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-compact"
                  onClick={() =>
                    updateLink(index, {
                      children: [
                        ...(link.children ?? []),
                        {
                          id: newId("child"),
                          label: "Submenu link",
                          href: "/",
                        },
                      ],
                    })
                  }
                >
                  Add submenu link
                </button>
              </div>
              {(link.children ?? []).map((child, childIndex) => (
                <div
                  key={child.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end"
                >
                  <FormField
                    id={`${child.id}-label`}
                    name="childLabel"
                    label="Link text"
                    value={child.label}
                    onChange={(value) => {
                      const children = [...(link.children ?? [])];
                      children[childIndex] = { ...child, label: value };
                      updateLink(index, { children });
                    }}
                  />
                  <PageField
                    id={`${child.id}-page`}
                    label="Goes to"
                    value={child.href}
                    emptyLabel="Select a page"
                    onChange={(value) => {
                      const children = [...(link.children ?? [])];
                      children[childIndex] = { ...child, href: value };
                      updateLink(index, { children });
                    }}
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger admin-btn-compact mb-1"
                    onClick={() => {
                      const children = (link.children ?? []).filter(
                        (_, i) => i !== childIndex
                      );
                      updateLink(index, {
                        children: children.length ? children : undefined,
                      });
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function SiteSettingsPage() {
  const loader = useCallback(() => getSiteSettings(), []);
  const { data, setData, isLoading, error, refetch } =
    useAdminResource(loader);
  const { success, error: toastError, neutral } = useToast();
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "branding" | "seo" | "navigation" | "pages" | "contact"
  >("branding");

  const settings = data ?? DEFAULT_SITE_SETTINGS;

  function patch(next: Partial<SiteSettings>) {
    setData({ ...settings, ...next });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await updateSiteSettings({
        branding: settings.branding,
        seo: settings.seo,
        navigation: settings.navigation,
        footer: settings.footer,
        pageHeaders: settings.pageHeaders,
        contactPage: settings.contactPage,
      });
      setData(saved);
      success("Site settings saved");
    } catch (err) {
      toastError(toFriendlyAdminError(err, "save site settings"));
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setResetOpen(false);
    setSaving(true);
    try {
      const saved = await resetSiteSettings();
      setData(saved);
      neutral("Settings reset to defaults");
    } catch (err) {
      toastError(toFriendlyAdminError(err, "reset site settings"));
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <AdminLoader label="Loading site settings" />;
  if (error) {
    return (
      <AdminErrorState
        title="Could not load settings"
        message={error}
        onRetry={refetch}
      />
    );
  }

  const branding = settings.branding;
  const tabs = [
    { id: "branding" as const, label: "Branding" },
    { id: "seo" as const, label: "SEO" },
    { id: "navigation" as const, label: "Nav & footer" },
    { id: "pages" as const, label: "Page headers" },
    { id: "contact" as const, label: "Contact page" },
  ];

  return (
    <div>
      <AdminPageHeader
        eyebrow="CMS-01"
        title="Site settings"
        description="Brand identity, navigation, footer links, SEO, and page headers across the public site."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setResetOpen(true)}
              disabled={saving}
            >
              Reset defaults
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`admin-btn admin-btn-compact ${
              activeTab === tab.id
                ? "admin-btn-primary"
                : "admin-btn-secondary"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "branding" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl">
          {(
            [
              ["name", "Academy name"],
              ["wordmark", "Wordmark"],
              ["wordmarkSuffix", "Wordmark suffix"],
              ["professor", "Professor name"],
              ["professorTitle", "Professor title"],
              ["role", "Role"],
              ["institution", "Institution"],
              ["tagline", "Tagline"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["mobile", "Mobile"],
              ["established", "Established"],
              ["footerBlurb", "Footer blurb"],
            ] as const
          ).map(([key, label]) => (
            <FormField
              key={key}
              id={`brand-${key}`}
              name={key}
              label={label}
              value={String(branding[key] ?? "")}
              onChange={(value) =>
                patch({ branding: { ...branding, [key]: value } })
              }
            />
          ))}
          <FormField
            id="brand-affiliation"
            name="affiliation"
            label="Affiliation"
            type="textarea"
            rows={3}
            value={branding.affiliation ?? ""}
            onChange={(value) =>
              patch({ branding: { ...branding, affiliation: value } })
            }
          />
          <FormField
            id="brand-officeHours"
            name="officeHours"
            label="Office hours"
            type="textarea"
            rows={3}
            value={branding.officeHours ?? ""}
            onChange={(value) =>
              patch({ branding: { ...branding, officeHours: value } })
            }
          />
          {(
            [
              ["line1", "Address line 1"],
              ["line2", "Address line 2"],
              ["governorate", "Governorate"],
              ["country", "Country"],
              ["postal", "Postal"],
            ] as const
          ).map(([key, label]) => (
            <FormField
              key={key}
              id={`addr-${key}`}
              name={key}
              label={label}
              value={String(branding.address?.[key] ?? "")}
              onChange={(value) =>
                patch({
                  branding: {
                    ...branding,
                    address: { ...branding.address, [key]: value },
                  },
                })
              }
            />
          ))}
        </div>
      )}

      {activeTab === "seo" && (
        <div className="grid grid-cols-1 gap-4 max-w-3xl">
          <FormField
            id="seo-title"
            name="title"
            label="Document title"
            value={settings.seo.title}
            onChange={(value) =>
              patch({ seo: { ...settings.seo, title: value } })
            }
          />
          <FormField
            id="seo-description"
            name="description"
            label="Meta description"
            type="textarea"
            rows={4}
            value={settings.seo.description}
            onChange={(value) =>
              patch({ seo: { ...settings.seo, description: value } })
            }
          />
        </div>
      )}

      {activeTab === "navigation" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <LinkEditor
            title="Primary navigation"
            links={settings.navigation.items}
            allowChildren
            onChange={(items) => patch({ navigation: { items } })}
          />
          <LinkEditor
            title="Footer links"
            links={settings.footer.links}
            onChange={(links) => patch({ footer: { links } })}
          />
        </div>
      )}

      {activeTab === "pages" && (
        <div className="space-y-6 max-w-4xl">
          {PAGE_KEYS.map((key) => {
            const header: PageHeaderContent = settings.pageHeaders[key] ?? {
              eyebrow: "",
              title: "",
              description: "",
            };
            return (
              <div
                key={key}
                className="border border-hairline bg-concrete p-4 space-y-3"
              >
                <p className="label-caps text-clay">/{key}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    id={`${key}-eyebrow`}
                    name="eyebrow"
                    label="Eyebrow"
                    value={header.eyebrow}
                    onChange={(value) =>
                      patch({
                        pageHeaders: {
                          ...settings.pageHeaders,
                          [key]: { ...header, eyebrow: value },
                        },
                      })
                    }
                  />
                  <FormField
                    id={`${key}-title`}
                    name="title"
                    label="Title"
                    value={header.title}
                    onChange={(value) =>
                      patch({
                        pageHeaders: {
                          ...settings.pageHeaders,
                          [key]: { ...header, title: value },
                        },
                      })
                    }
                  />
                </div>
                <FormField
                  id={`${key}-description`}
                  name="description"
                  label="Description"
                  type="textarea"
                  rows={3}
                  value={header.description}
                  onChange={(value) =>
                    patch({
                      pageHeaders: {
                        ...settings.pageHeaders,
                        [key]: { ...header, description: value },
                      },
                    })
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "contact" && (
        <div className="max-w-3xl">
          <FormField
            id="contact-intro"
            name="intro"
            label="Contact page introduction"
            type="textarea"
            rows={5}
            value={settings.contactPage.intro}
            onChange={(value) =>
              patch({ contactPage: { ...settings.contactPage, intro: value } })
            }
          />
        </div>
      )}

      <ConfirmDialog
        open={resetOpen}
        title="Reset site settings?"
        message="This replaces all branding, navigation, and page headers with the seeded defaults."
        confirmLabel="Reset"
        confirmTone="danger"
        onCancel={() => setResetOpen(false)}
        onConfirm={handleReset}
      />
    </div>
  );
}
