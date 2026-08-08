import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AsyncState } from "@/components/feedback/AsyncState";
import { CardGridSkeleton, Skeleton } from "@/components/feedback/Skeleton";
import { FormErrorSummary } from "@/components/forms/FormErrorSummary";
import { FormField } from "@/components/forms/FormField";

describe("shared form primitives", () => {
  it("connects labels, hints, errors, and required state", () => {
    render(
      <FormField
        id="email"
        label="Email"
        hint="Use your academy address"
        error="Enter a valid email"
        required
      />
    );

    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "Use your academy address Enter a valid email"
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email");
  });

  it("focuses the error summary when errors appear", async () => {
    const { rerender } = render(<FormErrorSummary errors={[]} />);

    rerender(<FormErrorSummary errors={["Email is required"]} />);

    await waitFor(() => expect(screen.getByRole("alert")).toHaveFocus());
  });
});

describe("shared async feedback", () => {
  it("announces errors and exposes retry actions", () => {
    const onRetry = vi.fn();
    render(
      <AsyncState
        kind="error"
        title="Projects unavailable"
        message="The archive could not be loaded."
        onRetry={onRetry}
      />
    );

    const region = screen.getByText("Projects unavailable").closest("section");
    expect(region).toHaveAttribute("aria-live", "assertive");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("gives standalone skeletons a status name", () => {
    render(<Skeleton label="Loading portfolio" />);
    expect(screen.getByRole("status", { name: "Loading portfolio" })).toBeVisible();
  });

  it("announces a loading card grid once", () => {
    render(<CardGridSkeleton count={2} />);
    expect(screen.getByText("Loading items", { selector: ".sr-only" })).toBeInTheDocument();
    expect(screen.queryAllByRole("status")).toHaveLength(0);
  });
});
