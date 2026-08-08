import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AsyncState } from "@/components/feedback/AsyncState";
import { CardGridSkeleton, Skeleton } from "@/components/feedback/Skeleton";
import { FormErrorSummary } from "@/components/forms/FormErrorSummary";
import { FormField } from "@/components/forms/FormField";
import { AdminEditModal } from "@/components/admin/AdminEditModal";
import { DataTable } from "@/components/admin/DataTable";

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

describe("admin editing primitives", () => {
  it("presents edits as a named modal with explicit save and cancel actions", () => {
    const onCancel = vi.fn();
    const onSave = vi.fn();

    render(
      <AdminEditModal
        open
        title="Edit lesson"
        context="Course: Design 1"
        isDirty
        onCancel={onCancel}
        onSave={onSave}
      >
        <label>
          Lesson title
          <input defaultValue="Introduction" />
        </label>
      </AdminEditModal>
    );

    expect(screen.getByRole("dialog", { name: "Edit lesson" })).toBeVisible();
    expect(screen.getByText("Course: Design 1")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(onSave).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("closes an edit modal with Escape", () => {
    const onCancel = vi.fn();
    render(
      <AdminEditModal
        open
        title="Edit item"
        onCancel={onCancel}
        onSave={vi.fn()}
      >
        <p>Editor</p>
      </AdminEditModal>
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("keeps table rows passive and exposes the named action", () => {
    const onOpen = vi.fn();
    render(
      <DataTable
        data={[{ id: "1", name: "First course" }]}
        getRowKey={(row) => row.id}
        columns={[
          { key: "name", header: "Course", render: (row) => row.name },
          {
            key: "actions",
            header: "Actions",
            render: () => <button onClick={onOpen}>Open and edit</button>,
          },
        ]}
      />
    );

    expect(screen.getByRole("row", { name: /First course/ })).not.toHaveAttribute("tabindex");
    fireEvent.click(screen.getAllByRole("button", { name: "Open and edit" })[0]);
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
