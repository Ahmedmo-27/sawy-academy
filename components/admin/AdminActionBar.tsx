interface AdminActionBarProps {
  isDirty?: boolean;
  isBusy?: boolean;
  saveLabel?: string;
  savedLabel?: string;
  secondary?: React.ReactNode;
  danger?: React.ReactNode;
  onSave: () => void;
}

export function AdminActionBar({
  isDirty = false,
  isBusy = false,
  saveLabel = "Save changes",
  savedLabel = "All changes saved",
  secondary,
  danger,
  onSave,
}: AdminActionBarProps) {
  return (
    <div className="sticky bottom-3 z-20 mt-8 border border-hairline bg-concrete/95 p-3 shadow-[0_-8px_24px_rgba(26,26,26,0.06)] nav-blur">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={onSave}
          disabled={isBusy || !isDirty}
        >
          {isBusy ? "Saving…" : saveLabel}
        </button>
        {secondary}
        {danger}
        <span className="dim-label ml-auto" role="status" aria-live="polite">
          {isDirty ? "Changes not saved" : savedLabel}
        </span>
      </div>
    </div>
  );
}
