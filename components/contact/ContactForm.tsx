"use client";

import { FormEvent, useId, useState } from "react";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          subject: data.get("subject"),
          message: data.get("message"),
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
    <form className="space-y-8 max-w-md pt-4" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="name" className="label-caps block mb-2">
          Name
          <span className="text-clay"> *</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          aria-required="true"
          aria-invalid={status === "error"}
          aria-describedby={
            status === "error"
              ? formErrorId
              : status === "success"
                ? successId
                : undefined
          }
          className="w-full bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="email" className="label-caps block mb-2">
          Email
          <span className="text-clay"> *</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          aria-required="true"
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? formErrorId : undefined}
          className="w-full bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="subject" className="label-caps block mb-2">
          Service Type
          <span className="text-clay"> *</span>
        </label>
        <select
          id="subject"
          name="subject"
          required
          aria-required="true"
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? formErrorId : undefined}
          className="w-full bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200 appearance-none cursor-pointer"
          defaultValue=""
        >
          <option value="" disabled>
            Select a service
          </option>
          {serviceTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="label-caps block mb-2">
          Message
          <span className="text-clay"> *</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          aria-required="true"
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? formErrorId : undefined}
          className="w-full bg-transparent hairline-border px-4 py-3 type-body text-charcoal resize-none focus-visible:border-clay transition-colors duration-200"
          placeholder="Describe your inquiry..."
        />
      </div>

      <button
        type="submit"
        className="action-primary mt-2 disabled:text-clay-muted disabled:cursor-not-allowed"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Sending…" : "Send Message"}
      </button>

      {status === "success" && (
        <p id={successId} className="type-body text-charcoal" role="status">
          Message received. I will reply within office hours.
        </p>
      )}
      {status === "error" && (
        <p id={formErrorId} className="type-body text-clay" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
