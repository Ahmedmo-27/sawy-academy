function formatSheetRef(index, prefix = "A") {
  return `${prefix}-${String(index + 1).padStart(2, "0")}`;
}

module.exports = { formatSheetRef };
