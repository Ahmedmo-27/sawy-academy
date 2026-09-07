import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LessonCourseRail } from "@/components/courses/LessonCourseRail";

const lessons = [
  {
    id: "lesson-1",
    slug: "first-lesson",
    sheetRef: "L-01",
    title: "First lesson",
    duration: "12 min",
    order: 1,
  },
  {
    id: "lesson-2",
    slug: "second-lesson",
    sheetRef: "L-02",
    title: "Second lesson",
    duration: "18 min",
    order: 2,
  },
  {
    id: "lesson-3",
    slug: "third-lesson",
    sheetRef: "L-03",
    title: "Third lesson",
    duration: "25 min",
    order: 3,
  },
];

describe("LessonCourseRail", () => {
  it("marks the current lesson and exposes course position", () => {
    render(
      <LessonCourseRail
        courseSlug="drawing-foundations"
        courseTitle="Drawing foundations"
        lessons={lessons}
        currentLessonId="lesson-2"
      />
    );

    expect(screen.getByRole("link", { name: /Second lesson/ })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(
      screen.getByRole("progressbar", { name: "Current position in course" })
    ).toHaveAttribute("aria-valuenow", "67");
    expect(screen.getByText(/Sheet 02 of 03/i)).toBeInTheDocument();
  });

  it("renders completion checkmarks and counter when completedLessonIds are provided", () => {
    render(
      <LessonCourseRail
        courseSlug="drawing-foundations"
        courseTitle="Drawing foundations"
        lessons={lessons}
        currentLessonId="lesson-2"
        completedLessonIds={["lesson-1", "lesson-2"]}
      />
    );

    // Progress counter
    expect(screen.getByText(/Sheet 02 of 03 · 2\/3 Complete/i)).toBeInTheDocument();

    // Completed markers
    const checkmarks = screen.getAllByText("✓");
    expect(checkmarks.length).toBe(2);

    // Uncompleted third lesson shows numerical index
    expect(screen.getByText("03")).toBeInTheDocument();
  });
});
