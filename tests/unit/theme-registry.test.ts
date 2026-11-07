import { describe, expect, it } from "vitest";
import { themeList, themes } from "@/lib/themes/registry";
import { isThemeId, THEME_IDS } from "@/lib/themes/types";

describe("design languages", () => {
  it("registers six languages with distinct layouts and motion", () => {
    expect(themeList.map((theme) => theme.id)).toEqual([...THEME_IDS]);

    const layouts = new Set(themeList.map((theme) => theme.layout));
    const reveals = new Set(themeList.map((theme) => theme.motion.reveal));
    const eases = new Set(themeList.map((theme) => theme.motion.ease));

    expect(layouts.size).toBe(themeList.length);
    expect(reveals.size).toBeGreaterThanOrEqual(4);
    expect(eases.size).toBeGreaterThanOrEqual(4);
  });

  it("keeps atelier as the readable default", () => {
    expect(themes.atelier.layout).toBe("bar");
    expect(themes.atelier.motion.reveal).toBe("rise");
    expect(isThemeId("atelier")).toBe(true);
    expect(isThemeId("pastel")).toBe(false);
    expect(isThemeId(null)).toBe(false);
  });

  it("gives every language its own travel and duration", () => {
    const signatures = themeList.map(
      (theme) =>
        `${theme.motion.reveal}:${theme.motion.duration}:${theme.motion.travel}:${theme.motion.ease}`
    );
    expect(new Set(signatures).size).toBe(themeList.length);
  });
});
