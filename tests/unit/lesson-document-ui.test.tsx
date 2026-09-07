import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LessonsManager } from "@/components/admin/LessonsManager";
import { ToastProvider } from "@/components/feedback/ToastProvider";
import * as lessonsApi from "@/lib/api/lessons";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("LessonsManager Media Controls", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof window !== "undefined" && !window.matchMedia) {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    }
  });

  const mockLessons = [
    {
      id: "lesson-01",
      slug: "lesson-one",
      title: "Harmonic Geometry",
      sheetRef: "HG-01",
      duration: "15 min",
      order: 1,
      videoAvailable: true,
      documentAvailable: true,
      videoProcessingStatus: "ready" as const,
    },
  {
    id: "lesson-02",
    slug: "lesson-two",
    title: "Planar Projections",
    sheetRef: "PP-02",
    duration: "20 min",
    order: 2,
    videoAvailable: false,
    documentAvailable: false,
    videoProcessingStatus: "none" as const,
  },
];

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

it("shows remove buttons when editing a lesson with attached video and PDF", async () => {
  renderWithToast(
    <LessonsManager
      courseSlug="bio-geometry-course"
      lessons={mockLessons}
    />
  );

  // Click "Edit" on the first lesson
  const editButtons = screen.getAllByRole("button", { name: /Edit/i });
  fireEvent.click(editButtons[0]);

  // Check that modal opened and displays existing media notices and removal buttons
  expect(
    screen.getByText(/A protected video is currently attached to this lesson/i)
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Remove video/i })
  ).toBeInTheDocument();

  expect(
    screen.getByText(/A private PDF is currently attached to this lesson/i)
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Remove PDF/i })
  ).toBeInTheDocument();
});

  it("opens ConfirmDialog when clicking Remove video and executes deleteLessonVideo", async () => {
    const deleteVideoSpy = vi
      .spyOn(lessonsApi, "deleteLessonVideo")
      .mockResolvedValueOnce({
        lessonId: "lesson-01",
        videoAvailable: false,
        status: "none",
      });

    renderWithToast(
      <LessonsManager
        courseSlug="bio-geometry-course"
        lessons={mockLessons}
      />
    );

    const editButtons = screen.getAllByRole("button", { name: /Edit/i });
    fireEvent.click(editButtons[0]);

    const removeVideoBtn = screen.getByRole("button", { name: /Remove video/i });
    fireEvent.click(removeVideoBtn);

    // Confirm dialog appears
    expect(screen.getByText("Remove video?")).toBeInTheDocument();
    expect(
      screen.getByText(/The video and all transcoded renditions will be deleted/i)
    ).toBeInTheDocument();

    // Click Confirm "Remove"
    const confirmBtn = screen.getByRole("button", { name: /^Remove$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteVideoSpy).toHaveBeenCalledWith("bio-geometry-course", "lesson-01");
    });
  });

  it("opens ConfirmDialog when clicking Remove PDF and executes deleteLessonDocument", async () => {
    const deleteDocSpy = vi
      .spyOn(lessonsApi, "deleteLessonDocument")
      .mockResolvedValueOnce({
        lessonId: "lesson-01",
        documentAvailable: false,
        status: "none",
      });

    renderWithToast(
      <LessonsManager
        courseSlug="bio-geometry-course"
        lessons={mockLessons}
      />
    );

    const editButtons = screen.getAllByRole("button", { name: /Edit/i });
    fireEvent.click(editButtons[0]);

    const removeDocBtn = screen.getByRole("button", { name: /Remove PDF/i });
    fireEvent.click(removeDocBtn);

    // Confirm dialog appears
    expect(screen.getByText("Remove PDF document?")).toBeInTheDocument();
    expect(
      screen.getByText(/The PDF document will be deleted from Cloudflare R2/i)
    ).toBeInTheDocument();

    // Click Confirm "Remove"
    const confirmBtn = screen.getByRole("button", { name: /^Remove$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteDocSpy).toHaveBeenCalledWith("bio-geometry-course", "lesson-01");
    });
  });

  it("does not show remove buttons when editing a lesson without media", async () => {
    renderWithToast(
      <LessonsManager
        courseSlug="bio-geometry-course"
        lessons={mockLessons}
      />
    );

    // Click "Edit" on the second lesson (which has no media)
    const editButtons = screen.getAllByRole("button", { name: /Edit/i });
    fireEvent.click(editButtons[1]);

    expect(
      screen.queryByText(/A protected video is currently attached/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Remove video/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/A private PDF is currently attached/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Remove PDF/i })
    ).not.toBeInTheDocument();
  });
});
