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
    ).toHaveAttribute("aria-valuenow", "100");
  });
});
