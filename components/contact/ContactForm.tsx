"use client";

import { FormEvent, useId, useState } from "react";
import { FormErrorSummary } from "@/components/forms/FormErrorSummary";
import { contactSchema, issuesByField } from "@/lib/validation/forms";

const serviceTypes = [
  "Design",
  "Consulting",
  "Research Collaboration",
  "Other",
];

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const formErrorId = useId();
  const successId = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const result = contactSchema.safeParse({
      name: data.get("name"),
      email: data.get("email"),
      subject: data.get("subject"),
      message: data.get("message"),
    });
    if (!result.success) {
      const nextErrors = issuesByField(result.error);
      setFieldErrors(nextErrors);
      setStatus("idle");
      requestAnimationFrame(() => {
        form
          .querySelector<HTMLElement>("[aria-invalid='true']")
          ?.focus();
      });
      return;
    }
    setFieldErrors({});

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.data.name,
          email: result.data.email,
          subject: result.data.subject,
          message: result.data.message,
        }),
      });

      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(payload.error ?? "Unable to send message.");
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  return (
    <form className="w-full" onSubmit={handleSubmit} noValidate>
      <FormErrorSummary errors={Object.values(fieldErrors)} />
      <div className="grid grid-cols-1 border-t border-hairline sm:grid-cols-2">
        <div className="border-b border-hairline py-6 sm:border-r sm:pr-8">
          <label htmlFor="name" className="label-caps mb-3 flex items-center gap-3">
            <span className="text-clay">01</span>
            Your name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={
              fieldErrors.name
                ? "name-error"
                : status === "success"
                  ? successId
                  : undefined
            }
            className="w-full border-0 bg-transparent px-0 py-2 font-serif text-xl text-charcoal transition-colors placeholder:font-sans placeholder:text-base focus-visible:text-clay"
            placeholder="How should we address you?"
          />
          {fieldErrors.name && (
            <p id="name-error" className="type-infill mt-2 text-error" role="alert">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className="border-b border-hairline py-6 sm:pl-8">
          <label htmlFor="email" className="label-caps mb-3 flex items-center gap-3">
            <span className="text-clay">02</span>
            Email address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            className="w-full border-0 bg-transparent px-0 py-2 font-serif text-xl text-charcoal transition-colors placeholder:font-sans placeholder:text-base focus-visible:text-clay"
            placeholder="you@example.com"
          />
          {fieldErrors.email && (
            <p id="email-error" className="type-infill mt-2 text-error" role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="border-b border-hairline py-6 sm:col-span-2">
          <label htmlFor="subject" className="label-caps mb-3 flex items-center gap-3">
            <span className="text-clay">03</span>
            Nature of inquiry *
          </label>
          <div className="relative">
            <select
              id="subject"
              name="subject"
              required
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.subject)}
              aria-describedby={fieldErrors.subject ? "subject-error" : undefined}
              className="w-full cursor-pointer appearance-none border-0 bg-transparent px-0 py-2 font-serif text-xl text-charcoal transition-colors focus-visible:text-clay"
              defaultValue=""
            >
              <option value="" disabled>
                Select an area
              </option>
              {serviceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-clay"
              fill="none"
            >
              <path d="m5 7 5 5 5-5" stroke="currentColor" strokeWidth="1.25" />
            </svg>
          </div>
          {fieldErrors.subject && (
            <p id="subject-error" className="type-infill mt-2 text-error" role="alert">
              {fieldErrors.subject}
            </p>
          )}
        </div>

        <div className="border-b border-hairline py-6 sm:col-span-2">
          <label htmlFor="message" className="label-caps mb-3 flex items-center gap-3">
            <span className="text-clay">04</span>
            Your message *
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            required
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.message)}
            aria-describedby={fieldErrors.message ? "message-error" : undefined}
            className="w-full resize-none border-0 bg-transparent px-0 py-2 font-serif text-xl leading-relaxed text-charcoal transition-colors placeholder:font-sans placeholder:text-base focus-visible:text-clay"
            placeholder="A few lines about your idea, timeline, or question..."
          />
          {fieldErrors.message && (
            <p id="message-error" className="type-infill mt-2 text-error" role="alert">
              {fieldErrors.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-6 pt-8 sm:flex-row sm:items-center">
        <p className="type-infill max-w-xs">
          By sending this form, you agree to be contacted about your inquiry.
        </p>
        <button
          type="submit"
          className="cta-entrance min-w-48 justify-between disabled:cursor-not-allowed"
          disabled={status === "submitting"}
          aria-busy={status === "submitting"}
        >
          <span>{status === "submitting" ? "Sending…" : "Send inquiry"}</span>
          <span aria-hidden="true">↗</span>
        </button>
      </div>

      <div className="mt-6 min-h-6" aria-live="polite">
        {status === "success" && (
          <p id={successId} className="type-body text-charcoal" role="status">
            Message received. We will reply within office hours.
          </p>
        )}
        {status === "error" && (
          <p id={formErrorId} className="type-body text-error" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </form>
  );
}
