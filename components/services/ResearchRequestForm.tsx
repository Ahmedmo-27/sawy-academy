"use client";

import { FormEvent, useState } from "react";
import { FormErrorSummary } from "@/components/forms/FormErrorSummary";
import { ResearchEntryPicker } from "@/components/services/ResearchEntryPicker";
import { ServiceFormField } from "@/components/services/ServiceFormField";
import { submitServiceRequest } from "@/lib/api/services";
import type { Research, ResearchServicePayload } from "@/lib/api/types";
import { issuesByField, researchRequestSchema } from "@/lib/validation/forms";

const interestOptions = [
  {
    label: "Collaborate on existing research",
    value: "collaborate-existing",
  },
  { label: "Propose new research", value: "propose-new" },
  {
    label: "Participate as contributor",
    value: "participate-contributor",
  },
];

interface ResearchRequestFormProps {
  onSuccess: () => void;
}

type FieldErrors = Partial<
  Record<
    | "name"
    | "email"
    | "interestType"
    | "linkedResearchId"
    | "researchAreaOrTopic"
    | "backgroundCvLink"
    | "form",
    string
  >
>;

const initialState = {
  name: "",
  email: "",
  affiliation: "",
  interestType: "",
  linkedResearchId: "",
  linkedResearchTitle: "",
  researchAreaOrTopic: "",
  backgroundCvLink: "",
  additionalNotes: "",
};

export function ResearchRequestForm({ onSuccess }: ResearchRequestFormProps) {
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

  function handleResearchSelect(researchId: string, research?: Research) {
    updateField("linkedResearchId", researchId);
    updateField("linkedResearchTitle", research?.title ?? "");
  }

  function validate() {
    const result = researchRequestSchema.safeParse(form);
    if (result.success) {
      setErrors({});
      return true;
    }
    const nextErrors = issuesByField(result.error) as FieldErrors;
    setErrors(nextErrors);
    requestAnimationFrame(() => {
      const firstField = Object.keys(nextErrors)[0];
      const idByField: Record<string, string> = {
        name: "research-name",
        email: "research-email",
        interestType: "research-interest",
        linkedResearchId: "research-entry",
        researchAreaOrTopic: "research-topic",
        backgroundCvLink: "research-cv",
      };
      document.getElementById(idByField[firstField])?.focus();
    });
    return false;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    setIsSubmitting(true);

    const payload: ResearchServicePayload = {
      type: "research",
      name: form.name.trim(),
      email: form.email.trim(),
      affiliation: form.affiliation.trim() || undefined,
      interestType: form.interestType,
      linkedResearchId:
        form.interestType === "collaborate-existing"
          ? form.linkedResearchId
          : undefined,
      linkedResearchTitle:
        form.interestType === "collaborate-existing"
          ? form.linkedResearchTitle || undefined
          : undefined,
      researchAreaOrTopic: form.researchAreaOrTopic.trim(),
      backgroundCvLink: form.backgroundCvLink.trim() || undefined,
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
      <div className="md:col-span-2">
        <FormErrorSummary errors={Object.values(errors).filter((value): value is string => Boolean(value))} />
      </div>
      <ServiceFormField
        id="research-name"
        label="Full name"
        value={form.name}
        required
        error={errors.name}
        onChange={(value) => updateField("name", value)}
      />

      <ServiceFormField
        id="research-email"
        label="Email"
        type="email"
        value={form.email}
        required
        placeholder="you@example.com"
        error={errors.email}
        onChange={(value) => updateField("email", value)}
      />

      <ServiceFormField
        id="research-affiliation"
        label="Affiliation / institution"
        value={form.affiliation}
        placeholder="University, studio, or organisation"
        onChange={(value) => updateField("affiliation", value)}
      />

      <ServiceFormField
        id="research-interest"
        label="Type of interest"
        type="select"
        value={form.interestType}
        required
        options={interestOptions}
        error={errors.interestType}
        onChange={(value) => {
          updateField("interestType", value);
          if (value !== "collaborate-existing") {
            updateField("linkedResearchId", "");
            updateField("linkedResearchTitle", "");
          }
        }}
      />

      {form.interestType === "collaborate-existing" && (
        <div className="md:col-span-2">
          <ResearchEntryPicker
            value={form.linkedResearchId}
            onChange={handleResearchSelect}
            error={errors.linkedResearchId}
          />
        </div>
      )}

      <div className="md:col-span-2">
        <ServiceFormField
          id="research-topic"
          label="Research area or topic"
          type="textarea"
          value={form.researchAreaOrTopic}
          required
          rows={6}
          placeholder="Describe the subject, question, or contribution you have in mind."
          error={errors.researchAreaOrTopic}
          onChange={(value) => updateField("researchAreaOrTopic", value)}
        />
      </div>

      <div className="md:col-span-2">
        <ServiceFormField
          id="research-cv"
          label="Relevant background / CV link"
          type="url"
          value={form.backgroundCvLink}
          placeholder="https://"
          error={errors.backgroundCvLink}
          onChange={(value) => updateField("backgroundCvLink", value)}
        />
      </div>

      <div className="md:col-span-2">
        <ServiceFormField
          id="research-notes"
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
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Submitting request…" : "Submit research request"}
        </button>
      </div>
    </form>
  );
}
