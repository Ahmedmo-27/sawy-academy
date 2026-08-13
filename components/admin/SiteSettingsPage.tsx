"use client";

import { useCallback, useRef, useState } from "react";
import { AdminEditModal } from "@/components/admin/AdminEditModal";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FormField } from "@/components/admin/FormField";
import { ImageGalleryField } from "@/components/admin/ImageGalleryField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { useToast } from "@/components/feedback/ToastProvider";
import { useAdminResource } from "@/hooks/useAdminResource";
import { fetchWithProgress } from "@/lib/load/withFetchProgress";
import { getMainPageDestinations } from "@/lib/admin/pageDestinations";
import { toFriendlyAdminError } from "@/lib/admin/friendly";
import {
  resetSiteSettings,
  updateSiteSettings,
} from "@/lib/api/settings";
import type {
  BrandingSettings,
  NavLinkItem,
  PageHeaderContent,
  SiteSettings,
} from "@/lib/api/types";
import { DEFAULT_SITE_SETTINGS } from "@/lib/branding";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

const PAGE_KEYS = [
  "portfolio",
  "courses",
  "products",
  "researches",
  "services",
  "faqs",
  "contact",
  "cart",
  "checkout",
  "login",
  "signup",
  "privacy",
] as const;

const NAV_PAGE_OPTIONS = getMainPageDestinations();

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

function pageName(key: string) {
  if (key === "researches") return "Research";
  if (key === "faqs") return "FAQs";
  if (key === "privacy") return "Privacy Policy";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function InstaPaySettingsPanel({
  branding,
  onChange,
}: {
  branding: BrandingSettings;
  onChange: (next: BrandingSettings) => void;
}) {
  const destinationType =
    branding.instapayDestinationType === "bank" ? "bank" : "phone";
  const recipientName =
    branding.instapayAccountName?.trim() || branding.professor || "—";
  const bankAccountName =
    branding.instapayBankAccountName?.trim() || recipientName;
  const phoneReady = Boolean(branding.instapayPhoneNumber?.trim());
  const bankReady = Boolean(
    branding.instapayBankName?.trim() ||
      branding.instapayBankAccountNumber?.trim()
  );
  const configured =
    (destinationType === "phone" && phoneReady) ||
    (destinationType === "bank" && bankReady);

  function patchBranding(partial: Partial<BrandingSettings>) {
    onChange({ ...branding, ...partial });
  }

  return (
    <div className="max-w-5xl grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] gap-8">
      <div className="space-y-6">
        <div>
          <p className="label-caps mb-2 text-charcoal-infill">
            Checkout transfer details
          </p>
          <p className="type-infill text-charcoal-muted leading-relaxed max-w-2xl">
            Students see this destination on cart and checkout when paying by
            InstaPay. Choose phone or bank, then save settings to publish.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormField
            id="instapay-destination-type"
            name="instapayDestinationType"
            label="Transfer type"
            type="select"
            value={destinationType}
            options={[
              { label: "Phone number", value: "phone" },
              { label: "Bank account", value: "bank" },
            ]}
            onChange={(value) =>
              patchBranding({
                instapayDestinationType: value === "bank" ? "bank" : "phone",
              })
            }
          />
          <FormField
            id="instapay-account-name"
            name="instapayAccountName"
            label="Recipient name"
            value={String(branding.instapayAccountName ?? "")}
            hint="Shown next to the transfer destination on checkout."
            onChange={(value) => patchBranding({ instapayAccountName: value })}
          />
          {destinationType === "phone" ? (
            <FormField
              id="instapay-phone-number"
              name="instapayPhoneNumber"
              label="InstaPay phone number"
              value={String(branding.instapayPhoneNumber ?? "")}
              placeholder="01X XXXX XXXX"
              hint="Use the number registered for InstaPay transfers."
              onChange={(value) =>
                patchBranding({ instapayPhoneNumber: value })
              }
            />
          ) : (
            <>
              <FormField
                id="instapay-bank-name"
                name="instapayBankName"
                label="Bank name"
                value={String(branding.instapayBankName ?? "")}
                onChange={(value) => patchBranding({ instapayBankName: value })}
              />
              <FormField
                id="instapay-bank-account-name"
                name="instapayBankAccountName"
                label="Bank account name (optional)"
                value={String(branding.instapayBankAccountName ?? "")}
                hint="Defaults to the recipient name when left blank."
                onChange={(value) =>
                  patchBranding({ instapayBankAccountName: value })
                }
              />
              <FormField
                id="instapay-bank-account-number"
                name="instapayBankAccountNumber"
                label="Account number / IBAN"
                value={String(branding.instapayBankAccountNumber ?? "")}
                onChange={(value) =>
                  patchBranding({ instapayBankAccountNumber: value })
                }
              />
            </>
          )}
          <div className="lg:col-span-2">
            <FormField
              id="instapay-instructions"
              name="instapayInstructions"
              label="Transfer instructions"
              type="textarea"
              rows={4}
              value={String(branding.instapayInstructions ?? "")}
              hint="Shown under the destination on the checkout payment sheet."
              onChange={(value) =>
                patchBranding({ instapayInstructions: value })
              }
            />
          </div>
        </div>
      </div>

      <aside className="border border-hairline bg-concrete p-4 h-fit space-y-3">
        <p className="label-caps text-clay">Student preview</p>
        <p className="label-caps">Transfer to</p>
        {!configured ? (
          <p className="type-infill text-charcoal-muted leading-relaxed">
            Destination is incomplete. Add a phone number or bank details before
            students check out.
          </p>
        ) : destinationType === "phone" ? (
          <div className="space-y-1 type-infill leading-relaxed">
            <p>
              <span className="text-charcoal-muted">Transfer to phone number: </span>
              <span className="tabular-nums text-charcoal select-all">
                {branding.instapayPhoneNumber}
              </span>
            </p>
            <p>
              <span className="text-charcoal-muted">Name: </span>
              <span className="text-charcoal select-all">{recipientName}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-1 type-infill leading-relaxed">
            <p className="text-charcoal">Transfer to bank account</p>
            {branding.instapayBankName?.trim() ? (
              <p>
                <span className="text-charcoal-muted">Bank: </span>
                <span className="text-charcoal select-all">
                  {branding.instapayBankName}
                </span>
              </p>
            ) : null}
            <p>
              <span className="text-charcoal-muted">Account name: </span>
              <span className="text-charcoal select-all">{bankAccountName}</span>
            </p>
            {branding.instapayBankAccountNumber?.trim() ? (
              <p>
                <span className="text-charcoal-muted">Account number / IBAN: </span>
                <span className="tabular-nums text-charcoal select-all">
                  {branding.instapayBankAccountNumber}
                </span>
              </p>
            ) : null}
          </div>
        )}
        {branding.instapayInstructions?.trim() ? (
          <p className="type-infill text-charcoal-muted leading-relaxed hairline-t pt-3">
            {branding.instapayInstructions}
          </p>
        ) : null}
      </aside>
    </div>
  );
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
    : [...NAV_PAGE_OPTIONS, { label: "Current selection", value }];

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
  const [editor, setEditor] = useState<{
    index: number | null;
    draft: NavLinkItem;
    initial: string;
  } | null>(null);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);

  function openAdd() {
    setEditor({
      index: null,
      draft: { id: newId("link"), label: "", href: "/" },
      initial: "",
    });
  }

  function openEdit(index: number) {
    const draft = {
      ...links[index],
      children: links[index].children?.map((child) => ({ ...child })),
    };
    setEditor({ index, draft, initial: JSON.stringify(draft) });
  }

  function updateDraft(patch: Partial<NavLinkItem>) {
    setEditor((current) =>
      current
        ? { ...current, draft: { ...current.draft, ...patch } }
        : current
    );
  }

  function saveDraft() {
    if (!editor) return;
    if (editor.index === null) {
      onChange([...links, editor.draft]);
    } else {
      onChange(
        links.map((link, index) =>
          index === editor.index ? editor.draft : link
        )
      );
    }
    setEditor(null);
  }

  function confirmRemove() {
    if (removeIndex === null) return;
    onChange(links.filter((_, index) => index !== removeIndex));
    setRemoveIndex(null);
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
          onClick={openAdd}
        >
          Add link
        </button>
      </div>

      {links.length === 0 && (
        <div className="border border-dashed border-hairline bg-concrete p-4">
          <p className="type-infill text-charcoal-muted">
            No links configured. Add a link to include one here.
          </p>
        </div>
      )}

      {links.map((link, index) => (
        <div
          key={link.id}
          className="border border-hairline bg-concrete p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="label-caps text-clay">Item {index + 1}</p>
              <p className="mt-1 font-medium text-charcoal">
                {link.label || "Untitled link"}
              </p>
              <p className="type-infill mt-1 break-all text-charcoal-muted">
                {link.href || "Menu only"}
                {allowChildren && link.children?.length
                  ? ` · ${link.children.length} submenu ${
                      link.children.length === 1 ? "link" : "links"
                    }`
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="admin-btn admin-btn-primary admin-btn-compact"
                onClick={() => openEdit(index)}
              >
                Edit
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-compact"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${link.label || `item ${index + 1}`} up`}
              >
                Move up
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-compact"
                onClick={() => move(index, 1)}
                disabled={index === links.length - 1}
                aria-label={`Move ${link.label || `item ${index + 1}`} down`}
              >
                Move down
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger admin-btn-compact"
                onClick={() => setRemoveIndex(index)}
              >
                Remove link
              </button>
            </div>
          </div>
        </div>
      ))}

      <AdminEditModal
        open={Boolean(editor)}
        title={
          editor?.index === null
            ? `Add ${title.toLowerCase()} link`
            : `Edit ${title.toLowerCase()} link`
        }
        description="Changes are kept in this draft until you save the link."
        context={title}
        saveLabel={editor?.index === null ? "Add link" : "Save link"}
        isDirty={
          Boolean(editor) &&
          (editor?.index === null ||
            JSON.stringify(editor?.draft) !== editor?.initial)
        }
        onCancel={() => setEditor(null)}
        onSave={saveDraft}
      >
        {editor && (
          <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              id={`${editor.draft.id}-label`}
              name="label"
              label="Link text"
              value={editor.draft.label}
              onChange={(value) => updateDraft({ label: value })}
            />
            <PageField
              id={`${editor.draft.id}-page`}
              label="Goes to"
              value={editor.draft.href}
              emptyLabel={
                allowChildren ? "Menu only (opens submenu)" : "Select a page"
              }
              onChange={(value) => updateDraft({ href: value })}
            />
          </div>

          {allowChildren && (
            <div className="border-l border-hairline pl-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="label-caps">Submenu links</p>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-compact"
                  onClick={() =>
                    updateDraft({
                      children: [
                        ...(editor.draft.children ?? []),
                        {
                          id: newId("child"),
                          label: "",
                          href: "/",
                        },
                      ],
                    })
                  }
                >
                  Add submenu link
                </button>
              </div>
              {(editor.draft.children ?? []).map((child, childIndex) => (
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
                      const children = [...(editor.draft.children ?? [])];
                      children[childIndex] = { ...child, label: value };
                      updateDraft({ children });
                    }}
                  />
                  <PageField
                    id={`${child.id}-page`}
                    label="Goes to"
                    value={child.href}
                    emptyLabel="Select a page"
                    onChange={(value) => {
                      const children = [...(editor.draft.children ?? [])];
                      children[childIndex] = { ...child, href: value };
                      updateDraft({ children });
                    }}
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger admin-btn-compact mb-1"
                    onClick={() => {
                      const children = (editor.draft.children ?? []).filter(
                        (_, i) => i !== childIndex
                      );
                      updateDraft({
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
        )}
      </AdminEditModal>

      <ConfirmDialog
        open={removeIndex !== null}
        title="Remove link?"
        message={
          removeIndex === null
            ? ""
            : `Remove “${links[removeIndex]?.label || "Untitled link"}” from ${title.toLowerCase()}? This takes effect in the settings draft immediately.`
        }
        confirmLabel="Remove link"
        confirmTone="danger"
        onCancel={() => setRemoveIndex(null)}
        onConfirm={confirmRemove}
      />
    </div>
  );
}

export function SiteSettingsPage() {
  const loader = useCallback(
    (onProgress: (progress: number, stepLabel?: string) => void) =>
      fetchWithProgress<SiteSettings>(
        "/api/settings",
        "Fetching site settings",
        onProgress
      ),
    []
  );
  const { data, setData, isLoading, error, progress, stepLabel, refetch } =
    useAdminResource(loader, "Loading site settings");
  const { success, error: toastError, neutral } = useToast();
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "branding"
    | "instapay"
    | "seo"
    | "navigation"
    | "pages"
    | "contact"
    | "services"
    | "shared"
  >("branding");
  const [pageHeaderEditor, setPageHeaderEditor] = useState<{
    key: (typeof PAGE_KEYS)[number];
    draft: PageHeaderContent;
    initial: string;
  } | null>(null);

  const settings = data ?? DEFAULT_SITE_SETTINGS;
  const savedSnapshot = useRef<string | null>(null);
  if (data && savedSnapshot.current === null) {
    savedSnapshot.current = JSON.stringify(data);
  }
  const isDirty =
    Boolean(data) && JSON.stringify(settings) !== savedSnapshot.current;
  useUnsavedChanges(isDirty && !saving);

  function patch(next: Partial<SiteSettings>) {
    setData({ ...settings, ...next });
  }

  function openPageHeaderEditor(
    key: (typeof PAGE_KEYS)[number],
    header: PageHeaderContent
  ) {
    const draft = { ...header };
    setPageHeaderEditor({ key, draft, initial: JSON.stringify(draft) });
  }

  function patchPageHeaderDraft(next: Partial<PageHeaderContent>) {
    setPageHeaderEditor((current) =>
      current
        ? { ...current, draft: { ...current.draft, ...next } }
        : current
    );
  }

  function savePageHeaderDraft() {
    if (!pageHeaderEditor) return;
    patch({
      pageHeaders: {
        ...settings.pageHeaders,
        [pageHeaderEditor.key]: pageHeaderEditor.draft,
      },
    });
    setPageHeaderEditor(null);
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
        servicesPage: settings.servicesPage,
      });
      setData(saved);
      savedSnapshot.current = JSON.stringify(saved);
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
      savedSnapshot.current = JSON.stringify(saved);
      neutral("Settings reset to defaults");
    } catch (err) {
      toastError(toFriendlyAdminError(err, "reset site settings"));
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <AdminLoader
        label="Loading site settings"
        stepLabel={stepLabel}
        progress={progress}
        fullScreen
      />
    );
  }
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
    { id: "instapay" as const, label: "InstaPay" },
    { id: "seo" as const, label: "Search appearance" },
    { id: "navigation" as const, label: "Menus & footer" },
    { id: "pages" as const, label: "Page introductions" },
    { id: "contact" as const, label: "Contact page" },
    { id: "services" as const, label: "Service images" },
    { id: "shared" as const, label: "Shared assets" },
  ];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Website"
        title="Site settings"
        description="Manage branding, InstaPay checkout details, menus, search appearance, page introductions, contact details, and images."
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
              ["wordmark", "Main logo text"],
              ["wordmarkSuffix", "Logo ending"],
              ["professor", "Professor name"],
              ["professorTitle", "Professor title"],
              ["role", "Job title"],
              ["institution", "Organization"],
              ["tagline", "Short slogan"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["mobile", "Mobile"],
              ["established", "Year established"],
              ["footerBlurb", "Footer description"],
              ["facebookUrl", "Facebook URL"],
              ["instagramUrl", "Instagram URL"],
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
            label="Associated organization"
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
          <div className="lg:col-span-2">
            <ImageUploadField
              label="Logo image"
              description="Public website-assets/branding logo."
              value={branding.logoUrl ?? ""}
              page="branding"
              onChange={(value) =>
                patch({ branding: { ...branding, logoUrl: value } })
              }
            />
          </div>
        </div>
      )}

      {activeTab === "instapay" && (
        <InstaPaySettingsPanel
          branding={branding}
          onChange={(next) => patch({ branding: next })}
        />
      )}

      {activeTab === "seo" && (
        <div className="grid grid-cols-1 gap-4 max-w-3xl">
          <FormField
            id="seo-title"
            name="title"
            label="Browser tab title"
            value={settings.seo.title}
            onChange={(value) =>
              patch({ seo: { ...settings.seo, title: value } })
            }
          />
          <FormField
            id="seo-description"
            name="description"
            label="Search result description"
            type="textarea"
            rows={4}
            value={settings.seo.description}
            onChange={(value) =>
              patch({ seo: { ...settings.seo, description: value } })
            }
          />
          <ImageUploadField
            label="Open Graph image"
            description="Default social share image (website-assets/branding)."
            value={settings.seo.ogImageUrl ?? ""}
            page="branding"
            onChange={(value) =>
              patch({ seo: { ...settings.seo, ogImageUrl: value } })
            }
          />
        </div>
      )}

      {activeTab === "navigation" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <LinkEditor
            title="Main menu"
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
                className="border border-hairline bg-concrete p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="label-caps text-clay">{pageName(key)} page</p>
                    <p className="mt-2 font-serif text-xl text-charcoal">
                      {header.title || "Untitled page header"}
                    </p>
                    <p className="type-infill mt-1 text-charcoal-muted">
                      {header.eyebrow || "No small heading"}
                    </p>
                    <p className="type-infill mt-2 max-w-2xl text-charcoal-muted">
                      {header.description || "No description"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary admin-btn-compact"
                    onClick={() => openPageHeaderEditor(key, header)}
                  >
                    Edit introduction
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "contact" && (
        <div className="max-w-3xl space-y-8">
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
          <ImageUploadField
            label="Contact page image"
            description="Stored under website-assets/contact/."
            value={settings.contactPage.imageUrl ?? ""}
            page="contact"
            onChange={(value) =>
              patch({
                contactPage: { ...settings.contactPage, imageUrl: value },
              })
            }
          />
        </div>
      )}

      {activeTab === "services" && (
        <div className="max-w-3xl space-y-8">
          <p className="type-infill text-charcoal-muted">
            Still photography for the public services page. Empty slots show
            construction-line sketches until uploaded.
          </p>
          {(
            [
              ["designImageUrl", "Design service card"],
              ["researchImageUrl", "Research service card"],
              ["processBriefImageUrl", "Process — Brief"],
              ["processReviewImageUrl", "Process — Review"],
              ["processDeliveryImageUrl", "Process — Delivery"],
            ] as const
          ).map(([key, label]) => (
            <ImageUploadField
              key={key}
              label={label}
              value={settings.servicesPage?.[key] ?? ""}
              page="services"
              onChange={(value) =>
                patch({
                  servicesPage: {
                    ...settings.servicesPage,
                    [key]: value,
                  },
                })
              }
            />
          ))}
        </div>
      )}

      {activeTab === "shared" && (
        <div className="max-w-3xl space-y-4">
          <p className="type-infill text-charcoal-muted">
            Cross-page decorative assets under website-assets/shared/. Store
            URLs here for reuse across the CMS.
          </p>
          <ImageGalleryField
            label="Shared images"
            value={JSON.stringify(settings.sharedAssetUrls ?? [])}
            page="shared"
            onChange={(value) => {
              try {
                const parsed = JSON.parse(value) as unknown;
                patch({
                  sharedAssetUrls: Array.isArray(parsed)
                    ? parsed.filter(
                        (item): item is string =>
                          typeof item === "string" && item.trim().length > 0
                      )
                    : [],
                });
              } catch {
                patch({ sharedAssetUrls: [] });
              }
            }}
          />
        </div>
      )}

      <AdminEditModal
        open={Boolean(pageHeaderEditor)}
        title={
          pageHeaderEditor
            ? `Edit ${pageName(pageHeaderEditor.key)} page introduction`
            : "Edit page introduction"
        }
        description="Update the heading and description shown at the top of this page."
        context="Page introductions"
        saveLabel="Save introduction"
        isDirty={
          Boolean(pageHeaderEditor) &&
          JSON.stringify(pageHeaderEditor?.draft) !== pageHeaderEditor?.initial
        }
        onCancel={() => setPageHeaderEditor(null)}
        onSave={savePageHeaderDraft}
      >
        {pageHeaderEditor && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                id={`${pageHeaderEditor.key}-eyebrow`}
                name="eyebrow"
                label="Small heading"
                value={pageHeaderEditor.draft.eyebrow}
                onChange={(value) =>
                  patchPageHeaderDraft({ eyebrow: value })
                }
              />
              <FormField
                id={`${pageHeaderEditor.key}-title`}
                name="title"
                label="Title"
                value={pageHeaderEditor.draft.title}
                onChange={(value) => patchPageHeaderDraft({ title: value })}
              />
            </div>
            <FormField
              id={`${pageHeaderEditor.key}-description`}
              name="description"
              label="Description"
              type="textarea"
              rows={4}
              value={pageHeaderEditor.draft.description}
              onChange={(value) =>
                patchPageHeaderDraft({ description: value })
              }
            />
          </div>
        )}
      </AdminEditModal>

      <div className="sticky bottom-0 z-20 mt-10 flex items-center justify-between gap-3 border border-hairline bg-concrete/95 p-3 nav-blur">
        <p className="dim-label" role="status">
          {isDirty ? "Unsaved changes" : "All changes saved"}
        </p>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={handleSave}
          disabled={saving || !isDirty}
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>

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
