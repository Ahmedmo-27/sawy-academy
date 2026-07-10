export function formatSheetRef(index: number, prefix = "A"): string {
  return `${prefix}-${String(index + 1).padStart(2, "0")}`;
}
