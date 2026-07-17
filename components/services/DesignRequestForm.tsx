"use client";

import { FormEvent, useState } from "react";
import { ReferenceImagesField } from "@/components/services/ReferenceImagesField";
import { ServiceFormField } from "@/components/services/ServiceFormField";
import { isValidEmail } from "@/components/services/validation";
import { submitServiceRequest } from "@/lib/api/services";
import type { DesignServicePayload } from "@/lib/api/types";

const projectTypeOptions = [
  { label: "Residential", value: "Residential" },
  { label: "Commercial", value: "Commercial" },
  { label: "Interior", value: "Interior" },
  { label: "Furniture", value: "Furniture" },
  { label: "Other", value: "Other" },
];

const budgetOptions = [
  { label: "Prefer not to say", value: "unspecified" },
  { label: "Under EGP 500,000", value: "under-500k" },
  { label: "EGP 500,000 – 2,000,000", value: "500k-2m" },
  { label: "EGP 2,000,000 – 5,000,000", value: "2m-5m" },
  { label: "Above EGP 5,000,000", value: "above-5m" },
];

interface DesignRequestFormProps {
  onSuccess: () => void;
}

type FieldErrors = Partial<
  Record<
    | "name"
    | "email"
    | "projectType"
    | "scopeOfWork"
    | "form",
    string
  >
>;

const initialState = {
  name: "",
  email: "",
  phone: "",
  projectType: "",
  projectLocation: "",
  scopeOfWork: "",
  siteSize: "",
  budgetRange: "",
  desiredTimeline: "",
  referenceImageUrls: [] as string[],
  additionalNotes: "",
};

export function DesignRequestForm({ onSuccess }: DesignRequestFormProps) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof typeof initialState>(
    key: K,
    value: (typeof initialState)[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function validate() {
    const nextErrors: FieldErrors = {};

    if (!form.name.trim()) nextErrors.name = "Full name is required.";
    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!form.projectType) nextErrors.projectType = "Select a project type.";
    if (!form.scopeOfWork.trim()) {
      nextErrors.scopeOfWork = "Describe what should be designed.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    setIsSubmitting(true);

    const payload: DesignServicePayload = {
      type: "design",
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      projectType: form.projectType,
      projectLocation: form.projectLocation.trim() || undefined,
      scopeOfWork: form.scopeOfWork.trim(),
      siteSize: form.siteSize.trim() || undefined,
      budgetRange:
        form.budgetRange && form.budgetRange !== "unspecified"
          ? form.budgetRange
          : undefined,
      desiredTimeline: form.desiredTimeline.trim() || undefined,
      referenceImageUrls:
        form.referenceImageUrls.length > 0
          ? form.referenceImageUrls
          : undefined,
      additionalNotes: form.additionalNotes.trim() || undefined,
    };

    try {
      await submitServiceRequest(payload);
      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Unable to submit request."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <ServiceFormField
        id="design-name"
        label="Full name"
        value={form.name}
        required
        error={errors.name}
        onChange={(value) => updateField("name", value)}
      />

      <ServiceFormField
        id="design-email"
        label="Email"
        type="email"
        value={form.email}
        required
        placeholder="you@example.com"
        error={errors.email}
        onChange={(value) => updateField("email", value)}
      />

      <ServiceFormField
        id="design-phone"
        label="Phone"
        value={form.phone}
        placeholder="Optional"
        onChange={(value) => updateField("phone", value)}
      />

      <ServiceFormField
        id="design-project-type"
        label="Project type"
        type="select"
        value={form.projectType}
        required
        options={projectTypeOptions}
        error={errors.projectType}
        onChange={(value) => updateField("projectType", value)}
      />

      <ServiceFormField
        id="design-location"
        label="Project location"
        value={form.projectLocation}
        placeholder="City, district, or site address"
        onChange={(value) => updateField("projectLocation", value)}
      />

      <ServiceFormField
        id="design-timeline"
        label="Desired timeline"
        value={form.desiredTimeline}
        placeholder="e.g. Concept design by Q3 2026"
        onChange={(value) => updateField("desiredTimeline", value)}
      />

      <div className="md:col-span-2">
        <ServiceFormField
          id="design-scope"
          label="Scope of work — what should be designed"
          type="textarea"
          value={form.scopeOfWork}
          required
          rows={6}
          placeholder="Describe deliverables, programme, and design expectations."
          error={errors.scopeOfWork}
          onChange={(value) => updateField("scopeOfWork", value)}
        />
      </div>

      <ServiceFormField
        id="design-site-size"
        label="Site size / area"
        value={form.siteSize}
        placeholder='e.g. "250 sqm"'
        onChange={(value) => updateField("siteSize", value)}
      />

      <ServiceFormField
        id="design-budget"
        label="Budget range"
        type="select"
        value={form.budgetRange}
        options={budgetOptions}
        onChange={(value) => updateField("budgetRange", value)}
      />

      <div className="md:col-span-2">
        <ReferenceImagesField
          value={form.referenceImageUrls}
          onChange={(value) => updateField("referenceImageUrls", value)}
        />
      </div>

      <div className="md:col-span-2">
        <ServiceFormField
          id="design-notes"
          label="Additional notes"
          type="textarea"
          value={form.additionalNotes}
          rows={4}
          onChange={(value) => updateField("additionalNotes", value)}
        />
      </div>

      {submitError && (
        <p className="type-body text-clay md:col-span-2" role="alert">
          {submitError}
        </p>
      )}

      <div className="md:col-span-2">
        <button
          type="submit"
          className="cta-entrance disabled:text-concrete/70"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting request…" : "Submit design request"}
        </button>
      </div>
    </form>
  );
}
