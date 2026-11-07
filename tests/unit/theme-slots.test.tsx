import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { themeCards } from "@/components/theme/cards";
import { themeHeaders } from "@/components/theme/headers";
import { themeSignatures } from "@/components/theme/signatures";
import { themeSlots } from "@/components/theme/slots";
import { THEME_IDS } from "@/lib/themes/types";

beforeEach(() => {
  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches:
      query === "(prefers-reduced-motion: no-preference)" ||
      !query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

describe("theme component slots", () => {
  it("gives every language its own header, card, and signature", () => {
    for (const id of THEME_IDS) {
      expect(themeSlots[id].Header).toBe(themeHeaders[id]);
      expect(themeSlots[id].Card).toBe(themeCards[id]);
      expect(themeSlots[id].Signature).toBe(themeSignatures[id]);
    }
    expect(new Set(THEME_IDS.map((id) => themeHeaders[id])).size).toBe(THEME_IDS.length);
    expect(new Set(THEME_IDS.map((id) => themeCards[id])).size).toBe(THEME_IDS.length);
    expect(new Set(THEME_IDS.map((id) => themeSignatures[id])).size).toBe(THEME_IDS.length);
  });

  it("renders a distinct header, with a page title only when a description is passed", () => {
    for (const id of THEME_IDS) {
      const Header = themeHeaders[id];
      const page = render(
        <Header eyebrow="Index" title={`${id} studio`} description="A measured line." />
      );
      expect(page.container.querySelector(`[data-theme-slot="header-${id}"]`)).toBeTruthy();
      const pageTitle = page.getByRole("heading", { level: 1 });
      expect(pageTitle.textContent).toContain(id);
      expect(pageTitle.textContent).toContain("studio");
      page.unmount();

      const section = render(<Header eyebrow="02 · Work" title={`${id} section`} />);
      const sectionTitle = section.getByRole("heading", { level: 2 });
      expect(sectionTitle.textContent).toContain(id);
      expect(sectionTitle.textContent).toContain("section");
      expect(section.queryByRole("heading", { level: 1 })).toBeNull();
      section.unmount();
    }
  });

  it("renders a distinct catalogue card and signature for every language", () => {
    for (const id of THEME_IDS) {
      const Card = themeCards[id];
      const card = render(
        <Card
          title={`${id} card`}
          meta="Study · 2024"
          image="/images/hero/philosophy-drawing.jpg"
          href="/portfolio/study"
          index={0}
        />
      );
      expect(card.container.querySelector(`[data-theme-slot="card-${id}"]`)).toBeTruthy();
      expect(card.getByRole("heading", { name: `${id} card` })).toBeTruthy();
      card.unmount();

      const Signature = themeSignatures[id];
      const signature = render(<Signature />);
      expect(signature.container.querySelector(`[data-theme-slot="signature-${id}"]`)).toBeTruthy();
      signature.unmount();
    }
  });
});
