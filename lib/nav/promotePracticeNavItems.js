/**
 * Ensure Portfolio / Research sit under an expandable Practice flyout.
 * If a prior flatten left them as top-level links, nest them back under Practice.
 */

function isPortfolioItem(item) {
  if (!item || typeof item !== "object") return false;
  return (
    item.id === "portfolio" ||
    item.href === "/portfolio" ||
    String(item.label || "").trim().toLowerCase() === "portfolio"
  );
}

function isResearchItem(item) {
  if (!item || typeof item !== "object") return false;
  const label = String(item.label || "").trim().toLowerCase();
  return (
    item.id === "researches" ||
    item.id === "research" ||
    item.href === "/researches" ||
    label === "research" ||
    label === "researches"
  );
}

function isPracticeItem(item) {
  if (!item || typeof item !== "object") return false;
  if (item.id === "practice") return true;
  const label = String(item.label || "").trim().toLowerCase();
  return label === "practice";
}

function restorePracticeNavItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) return items;

  const existingPractice = items.find(
    (item) => isPracticeItem(item) && item.children?.length
  );
  if (existingPractice) return items;

  const portfolio = items.find(isPortfolioItem);
  const research = items.find(isResearchItem);
  if (!portfolio && !research) return items;

  const children = [];
  if (portfolio) {
    children.push({
      id: portfolio.id || "portfolio",
      label: portfolio.label || "Portfolio",
      href: portfolio.href || "/portfolio",
    });
  }
  if (research) {
    children.push({
      id: research.id || "researches",
      label: research.label || "Researches",
      href: research.href || "/researches",
    });
  }

  const practice = {
    id: "practice",
    label: "Practice",
    href: "",
    children,
  };

  const next = [];
  let inserted = false;
  for (const item of items) {
    if (isPortfolioItem(item) || isResearchItem(item) || isPracticeItem(item)) {
      if (!inserted) {
        next.push(practice);
        inserted = true;
      }
      continue;
    }
    next.push(item);
  }

  if (!inserted) next.unshift(practice);
  return next;
}

module.exports = {
  restorePracticeNavItems,
  /** @deprecated use restorePracticeNavItems — kept so older requires do not crash */
  promotePracticeNavItems: restorePracticeNavItems,
};
