"use client";

import { useSiteSettings } from "@/components/cms/SiteContentProvider";
import type { BrandingSettings } from "@/lib/api/types";

function hasPhoneDestination(branding: BrandingSettings) {
  return Boolean(branding.instapayPhoneNumber?.trim());
}

function hasBankDestination(branding: BrandingSettings) {
  return Boolean(
    branding.instapayBankName?.trim() ||
      branding.instapayBankAccountNumber?.trim()
  );
}

export function InstaPayTransferDetails({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { branding } = useSiteSettings();
  const type = branding.instapayDestinationType === "bank" ? "bank" : "phone";
  const name = branding.instapayAccountName?.trim() || branding.professor;
  const bankAccountName =
    branding.instapayBankAccountName?.trim() || name;
  const instructions = branding.instapayInstructions?.trim();
  const phoneReady = type === "phone" && hasPhoneDestination(branding);
  const bankReady = type === "bank" && hasBankDestination(branding);
  const configured = phoneReady || bankReady;

  if (!configured) {
    return (
      <div className={compact ? "space-y-2" : "space-y-3"}>
        <p className="label-caps">Transfer destination</p>
        <p className="type-infill leading-relaxed">
          Payment destination is not configured yet. Contact the studio at{" "}
          <a href={`mailto:${branding.email}`} className="action-secondary">
            {branding.email}
          </a>
          {branding.phone ? (
            <>
              {" "}
              or{" "}
              <a href={`tel:${branding.phone.replace(/\s/g, "")}`} className="action-secondary">
                {branding.phone}
              </a>
            </>
          ) : null}{" "}
          for transfer details.
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <p className="label-caps">Transfer to</p>
      {phoneReady ? (
        <div className="space-y-1 type-infill leading-relaxed">
          <p>
            <span className="text-charcoal-muted">Transfer to phone number: </span>
            <span className="tabular-nums text-charcoal select-all">
              {branding.instapayPhoneNumber}
            </span>
          </p>
          <p>
            <span className="text-charcoal-muted">Name: </span>
            <span className="text-charcoal select-all">{name}</span>
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
      {!compact && instructions ? (
        <p className="type-infill text-charcoal-muted leading-relaxed">
          {instructions}
        </p>
      ) : null}
    </div>
  );
}
