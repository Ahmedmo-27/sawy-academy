"use client";

import { FormEvent, useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FormField } from "@/components/admin/FormField";
import { useToast } from "@/components/feedback/ToastProvider";
import {
  createLesson,
  deleteLesson,
  reorderLessons,
  updateLesson,
} from "@/lib/api/courses";
import type { Lesson } from "@/lib/api/types";

interface LessonsManagerProps {
  courseSlug: string;
  lessons: Lesson[];
}

const emptyLesson = {
  id: "",
  sheetRef: "",
  title: "",
  duration: "",
  order: "1",
};

type LessonForm = typeof emptyLesson;

function getLessonKey(lesson: Lesson) {
  return lesson._id ?? lesson.id;
}

function toLessonInput(form: LessonForm) {
  return {
    id: form.id,
    sheetRef: form.sheetRef,
    title: form.title,
    duration: form.duration,
    order: Number(form.order),
  };
}

export function LessonsManager({ courseSlug, lessons }: LessonsManagerProps) {
  const { success, error: toastError, neutral } = useToast();
  const [items, setItems] = useState<Lesson[]>(lessons);
  const [form, setForm] = useState<LessonForm>({
    ...emptyLesson,
    order: String(lessons.length + 1),
  });
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function updateForm(key: keyof LessonForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(lesson: Lesson) {
    setEditingKey(getLessonKey(lesson));
    setForm({
      id: lesson.id,
      sheetRef: lesson.sheetRef,
      title: lesson.title,
      duration: lesson.duration,
      order: String(lesson.order),
    });
  }

  function resetForm() {
    setEditingKey(null);
    setForm({ ...emptyLesson, order: String(items.length + 1) });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      if (editingKey) {
        const updated = await updateLesson(
          courseSlug,
          editingKey,
          toLessonInput(form)
        );
        setItems((current) =>
          current.map((lesson) =>
            getLessonKey(lesson) === editingKey ? updated : lesson
          )
        );
        success("Changes saved");
      } else {
        const created = await createLesson(courseSlug, toLessonInput(form));
        setItems((current) => [...current, created]);
        success("Created successfully");
      }

      resetForm();
    } catch (err) {
      const message = "We couldn't save this lesson. Please try again.";
      setError(message);
      toastError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function moveLesson(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    setItems(next.map((lesson, order) => ({ ...lesson, order: order + 1 })));

    try {
      await reorderLessons(courseSlug, next.map(getLessonKey));
    } catch (err) {
      const message = "We couldn't reorder the lessons. Please try again.";
      setError(message);
      toastError(message);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setIsSaving(true);
    setError("");

    try {
      await deleteLesson(courseSlug, getLessonKey(deleteTarget));
      setItems((current) =>
        current.filter(
          (lesson) => getLessonKey(lesson) !== getLessonKey(deleteTarget)
        )
      );
      setDeleteTarget(null);
      neutral("Deleted");
    } catch (err) {
      const message = "We couldn't delete this lesson. Please try again.";
      setError(message);
      toastError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps mb-4 text-charcoal-infill">
          Lessons — {String(items.length).padStart(2, "0")}
        </p>
        <ul>
          {items.map((lesson, index) => (
            <li
              key={getLessonKey(lesson)}
              className={index > 0 ? "hairline-t" : ""}
            >
              <div className="grid grid-cols-12 items-center gap-4 py-5">
                <span className="col-span-2 sm:col-span-1 label-caps text-clay">
                  {String(lesson.order).padStart(2, "0")}
                </span>
                <span className="col-span-3 sm:col-span-2 dim-label">
                  {lesson.sheetRef}
                </span>
                <span className="col-span-7 sm:col-span-4 type-title text-base text-charcoal">
                  {lesson.title}
                </span>
                <span className="col-span-12 sm:col-span-2 label-caps">
                  {lesson.duration}
                </span>
                <span className="col-span-12 sm:col-span-3 flex flex-wrap justify-start sm:justify-end gap-2">
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary admin-btn-compact"
                    onClick={() => void moveLesson(index, -1)}
                    disabled={index === 0}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary admin-btn-compact"
                    onClick={() => void moveLesson(index, 1)}
                    disabled={index === items.length - 1}
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary admin-btn-compact"
                    onClick={() => startEdit(lesson)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger admin-btn-compact"
                    onClick={() => setDeleteTarget(lesson)}
                  >
                    Delete
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <form
        className="hairline-border bg-concrete-dark/30 p-6 space-y-6"
        onSubmit={handleSubmit}
      >
        <p className="eyebrow text-clay">
          {editingKey ? "Edit lesson" : "Add a lesson"}
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            id="lesson-id"
            name="lesson-id"
            label="ID"
            value={form.id}
            required
            onChange={(value) => updateForm("id", value)}
          />
          <FormField
            id="lesson-sheet-ref"
            name="lesson-sheet-ref"
            label="Sheet reference"
            value={form.sheetRef}
            required
            onChange={(value) => updateForm("sheetRef", value)}
          />
          <FormField
            id="lesson-title"
            name="lesson-title"
            label="Title"
            value={form.title}
            required
            onChange={(value) => updateForm("title", value)}
          />
          <FormField
            id="lesson-duration"
            name="lesson-duration"
            label="Duration"
            value={form.duration}
            required
            onChange={(value) => updateForm("duration", value)}
          />
          <FormField
            id="lesson-order"
            name="lesson-order"
            label="Order"
            type="number"
            value={form.order}
            required
            onChange={(value) => updateForm("order", value)}
          />
        </div>
        {error && <p className="type-infill text-clay">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={isSaving}
          >
            {isSaving ? "Saving" : editingKey ? "Update lesson" : "Add lesson"}
          </button>
          {editingKey && (
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={resetForm}
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.title ?? "lesson"}?`}
        message="This lesson will be removed from the course. This can't be undone."
        confirmLabel="Delete"
        isBusy={isSaving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
