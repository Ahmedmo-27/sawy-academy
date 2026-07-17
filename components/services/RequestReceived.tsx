import { ScaleBar } from "@/components/decorative/ScaleBar";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { BRAND } from "@/lib/branding";

interface RequestReceivedProps {
  requestLabel: string;
}

export function RequestReceived({ requestLabel }: RequestReceivedProps) {
  return (
    <ThresholdFrame label="Submission stamp">
      <div className="hairline-border p-8 lg:p-10 mt-4 bg-concrete/80">
        <ScaleBar scale="1:100" className="mb-6 max-w-[120px]" />

        <div className="hairline-b pb-6 mb-6">
          <p className="label-caps mb-2">Status</p>
          <p className="type-title">Request Received</p>
        </div>

        <div className="hairline-b pb-6 mb-6">
          <p className="label-caps mb-2">Sheet type</p>
          <p className="type-body">{requestLabel}</p>
        </div>

        <div className="hairline-b pb-6 mb-6">
          <p className="label-caps mb-2">Office</p>
          <p className="type-infill leading-relaxed">
            {BRAND.professorTitle}&apos;s office will review this submission and
            follow up during office hours. Correspondence is handled in the order
            received.
          </p>
        </div>

        <div className="flex justify-between items-end pt-2">
          <p className="label-caps">Filed</p>
          <p className="font-serif text-sm italic text-charcoal-infill">
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </ThresholdFrame>
  );
}
