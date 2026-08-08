import { AsyncState } from "@/components/feedback/AsyncState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { ProfileSectionShell } from "@/components/profile/ProfileSectionShell";

interface ProfileSectionLoadingProps {
  id: string;
  label: string;
}

export function ProfileSectionLoading({
  id,
  label,
}: ProfileSectionLoadingProps) {
  return (
    <ProfileSectionShell id={id} label={label}>
      <div
        className="hairline-border mt-4 bg-concrete p-6 sm:p-8"
        role="status"
        aria-label={`Loading ${label.toLowerCase()}`}
        aria-busy="true"
      >
        <span className="sr-only">Loading {label.toLowerCase()}</span>
        <Skeleton decorative className="h-3 w-28" />
        <Skeleton decorative className="mt-5 h-7 w-2/3" />
        <Skeleton decorative className="mt-4 h-3 w-full" />
        <Skeleton decorative className="mt-3 h-3 w-4/5" />
      </div>
    </ProfileSectionShell>
  );
}

interface ProfileSectionErrorProps {
  id: string;
  label: string;
  title: string;
  message: string;
  onRetry: () => void;
}

export function ProfileSectionError({
  id,
  label,
  title,
  message,
  onRetry,
}: ProfileSectionErrorProps) {
  return (
    <ProfileSectionShell id={id} label={label}>
      <AsyncState
        kind="error"
        className="mt-4"
        title={title}
        message={message}
        onRetry={onRetry}
      />
    </ProfileSectionShell>
  );
}
