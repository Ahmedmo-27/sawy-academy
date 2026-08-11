"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { AdminEditModal } from "@/components/admin/AdminEditModal";
import { FormField } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { ProcessProgressBar } from "@/components/feedback/ProcessProgressBar";
import { useToast } from "@/components/feedback/ToastProvider";
import {
  createLesson,
  deleteLesson,
  reorderLessons,
  updateLesson,
} from "@/lib/api/courses";
import {
  pollLessonVideoProcessing,
  retryLessonVideoProcessing,
  uploadLessonDocument,
  uploadLessonVideo,
  type LessonVideoProcessing,
} from "@/lib/api/lessons";
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
  previewImage: "",
};

type LessonForm = typeof emptyLesson;

function getLessonKey(lesson: Lesson) {
  return lesson._id ?? lesson.id;
}

function videoStatusLabel(status: string) {
  const labels: Record<string, string> = {
    queued: "Waiting to prepare",
    processing: "Preparing",
    ready: "Ready",
    failed: "Needs attention",
  };
  return labels[status] ?? status;
}

function toLessonInput(form: LessonForm) {
  return {
    id: form.id,
    sheetRef: form.sheetRef,
    title: form.title,
    duration: form.duration,
    order: Number(form.order),
    previewImage: form.previewImage || undefined,
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
  const [formOpen, setFormOpen] = useState(false);
  const [formSnapshot, setFormSnapshot] = useState(JSON.stringify(emptyLesson));
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadPhase, setVideoUploadPhase] = useState<
    "sending" | "storing"
  >("sending");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentUploadProgress, setDocumentUploadProgress] = useState(0);
  const [videoStatuses, setVideoStatuses] = useState<
    Record<string, LessonVideoProcessing>
  >({});
  const pollingControllers = useRef(new Map<string, AbortController>());
  const formRef = useRef<HTMLFormElement>(null);
  const startVideoPollingRef = useRef<(lessonKey: string) => void>(() => {});
  const uploadInFlight = isSaving && Boolean(videoFile || documentFile);

  useEffect(() => {
    if (!uploadInFlight) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [uploadInFlight]);

  useEffect(() => {
    const controllers = pollingControllers.current;
    lessons.forEach((lesson) => {
      if (
        lesson.videoProcessingStatus === "queued" ||
        lesson.videoProcessingStatus === "processing"
      ) {
        startVideoPollingRef.current(getLessonKey(lesson));
      }
    });

    return () => {
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
    };
  }, [courseSlug, lessons]);

  function updateVideoStatus(lessonKey: string, status: LessonVideoProcessing) {
    setVideoStatuses((current) => ({ ...current, [lessonKey]: status }));
    setItems((current) =>
      current.map((lesson) =>
        getLessonKey(lesson) === lessonKey
          ? {
              ...lesson,
              videoAvailable: status.processingStatus === "ready",
              videoProcessingStatus: status.processingStatus,
            }
          : lesson
      )
    );
  }

  function startVideoPolling(lessonKey: string) {
    pollingControllers.current.get(lessonKey)?.abort();
    const controller = new AbortController();
    pollingControllers.current.set(lessonKey, controller);

    void pollLessonVideoProcessing(courseSlug, lessonKey, {
      signal: controller.signal,
      onStatus: (status) => updateVideoStatus(lessonKey, status),
    })
      .catch((caughtError) => {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === "AbortError"
        ) {
          return;
        }
        const message =
          "We couldn't check whether the video is ready. Try again shortly.";
        setError(message);
        toastError(message);
      })
      .finally(() => {
        if (pollingControllers.current.get(lessonKey) === controller) {
          pollingControllers.current.delete(lessonKey);
        }
      });
  }
  startVideoPollingRef.current = startVideoPolling;

  async function retryVideoProcessing(lessonKey: string) {
    setError("");
    try {
      const queued = await retryLessonVideoProcessing(courseSlug, lessonKey);
      setVideoStatuses((current) => ({
        ...current,
        [lessonKey]: {
          ...(current[lessonKey] ?? {
            attempts: 0,
            maxAttempts: 0,
            availableAt: null,
            error: null,
            renditions: [],
            readyAt: null,
          }),
          lessonId: queued.lessonId,
          assetId: queued.assetId,
          generation: current[lessonKey]?.generation ?? null,
          status: "queued",
          processingStatus: "queued",
          error: null,
        },
      }));
      success("The video will be prepared again");
      startVideoPolling(lessonKey);
    } catch {
      const message = "The video could not be prepared again. Please try later.";
      setError(message);
      toastError(message);
    }
  }

  function updateForm(key: keyof LessonForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(lesson: Lesson) {
    setEditingKey(getLessonKey(lesson));
    setVideoFile(null);
    setVideoUploadProgress(0);
    setDocumentFile(null);
    setDocumentUploadProgress(0);
    const nextForm = {
      id: lesson.id,
      sheetRef: lesson.sheetRef,
      title: lesson.title,
      duration: lesson.duration,
      order: String(lesson.order),
      previewImage: lesson.previewImage ?? "",
    };
    setForm(nextForm);
    setFormSnapshot(JSON.stringify(nextForm));
    setFormOpen(true);
  }

  function startAdd() {
    const nextForm = { ...emptyLesson, order: String(items.length + 1) };
    setEditingKey(null);
    setVideoFile(null);
    setVideoUploadProgress(0);
    setDocumentFile(null);
    setDocumentUploadProgress(0);
    setForm(nextForm);
    setFormSnapshot(JSON.stringify(nextForm));
    setFormOpen(true);
  }

  function resetForm() {
    setEditingKey(null);
    setVideoFile(null);
    setVideoUploadProgress(0);
    setDocumentFile(null);
    setDocumentUploadProgress(0);
    setForm({ ...emptyLesson, order: String(items.length + 1) });
    setFormOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setVideoUploadProgress(0);
    let metadataSaved = false;
    let savedLesson: Lesson | null = null;

    try {
      if (editingKey) {
        const updatedLesson = await updateLesson(
          courseSlug,
          editingKey,
          toLessonInput(form)
        );
        savedLesson = updatedLesson;
        metadataSaved = true;
        setItems((current) =>
          current.map((lesson) =>
            getLessonKey(lesson) === editingKey ? updatedLesson : lesson
          )
        );
      } else {
        const createdLesson = await createLesson(
          courseSlug,
          toLessonInput(form)
        );
        savedLesson = createdLesson;
        metadataSaved = true;
        setItems((current) => [...current, createdLesson]);
      }

      if (videoFile) {
        if (!savedLesson) throw new Error("Lesson could not be resolved");
        const lessonKey = getLessonKey(savedLesson);
        const queued = await uploadLessonVideo(
          courseSlug,
          lessonKey,
          videoFile,
          (progress, phase) => {
            setVideoUploadProgress(progress);
            if (phase) setVideoUploadPhase(phase);
          }
        );
        const uploadedLesson = {
          ...savedLesson,
          videoAvailable: false,
          videoProcessingStatus: "queued" as const,
        };
        savedLesson = uploadedLesson;
        setItems((current) =>
          current.map((lesson) =>
            getLessonKey(lesson) === lessonKey ? uploadedLesson : lesson
          )
        );
        setVideoStatuses((current) => ({
          ...current,
          [lessonKey]: {
            lessonId: queued.lessonId,
            assetId: queued.assetId,
            generation: queued.generation,
            status: "queued",
            processingStatus: "queued",
            attempts: 0,
            maxAttempts: 0,
            availableAt: null,
            error: null,
            renditions: [],
            readyAt: null,
          },
        }));
        startVideoPolling(lessonKey);
      }

      if (documentFile) {
        if (!savedLesson) throw new Error("Lesson could not be resolved");
        const lessonKey = getLessonKey(savedLesson);
        await uploadLessonDocument(
          courseSlug,
          lessonKey,
          documentFile,
          setDocumentUploadProgress
        );
        const withDoc = {
          ...savedLesson,
          documentAvailable: true,
        };
        savedLesson = withDoc;
        setItems((current) =>
          current.map((lesson) =>
            getLessonKey(lesson) === lessonKey ? withDoc : lesson
          )
        );
      }

      success(
        videoFile
          ? "Lesson saved. The video is now being prepared for students."
          : documentFile
            ? "Lesson saved with PDF document."
            : editingKey
              ? "Changes saved"
              : "Created successfully"
      );
      resetForm();
    } catch (caughtError) {
      if (metadataSaved && savedLesson && !editingKey) {
        setEditingKey(getLessonKey(savedLesson));
      }
      const message = metadataSaved
        ? "The lesson was saved, but a media upload failed. Edit the lesson to try the upload again."
        : "We couldn't save this lesson. Please try again.";
      setError(message);
      toastError(
        caughtError instanceof Error ? caughtError.message : message
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function moveLesson(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    const next = [...items];
    const previous = items;
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    setItems(next.map((lesson, order) => ({ ...lesson, order: order + 1 })));
    setIsReordering(true);

    try {
      await reorderLessons(courseSlug, next.map(getLessonKey));
      success("Lesson order saved");
    } catch {
      setItems(previous);
      const message = "We couldn't reorder the lessons. Please try again.";
      setError(message);
      toastError(message);
    } finally {
      setIsReordering(false);
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
    } catch {
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label-caps text-charcoal-infill">
              Lessons — {String(items.length).padStart(2, "0")}
            </p>
            <p className="type-infill mt-1 text-charcoal-muted">
              Reordering saves immediately. Adding or editing opens a separate window.
            </p>
          </div>
          <button type="button" className="admin-btn admin-btn-primary" onClick={startAdd}>
            Add lesson
          </button>
        </div>
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
                  {lesson.sheetRef || `Lesson ${index + 1}`}
                </span>
                <div className="col-span-7 sm:col-span-4">
                  <span className="type-title text-base text-charcoal">
                    {lesson.title}
                  </span>
                  {(videoStatuses[getLessonKey(lesson)]?.processingStatus ??
                    lesson.videoProcessingStatus) &&
                    (videoStatuses[getLessonKey(lesson)]?.processingStatus ??
                      lesson.videoProcessingStatus) !== "none" && (
                      <p
                        className="type-infill mt-1 text-charcoal-muted"
                        role={
                          videoStatuses[getLessonKey(lesson)]
                            ?.processingStatus === "failed"
                            ? "alert"
                            : "status"
                        }
                      >
                        Video:{" "}
                        {videoStatusLabel(
                          videoStatuses[getLessonKey(lesson)]
                            ?.processingStatus ?? lesson.videoProcessingStatus ?? ""
                        )}
                        {videoStatuses[getLessonKey(lesson)]?.processingStatus ===
                          "failed" &&
                          videoStatuses[getLessonKey(lesson)]?.error?.message &&
                          ` — ${videoStatuses[getLessonKey(lesson)].error?.message}`}
                      </p>
                    )}
                </div>
                <span className="col-span-12 sm:col-span-2 label-caps">
                  {lesson.duration}
                </span>
                <span className="col-span-12 sm:col-span-3 flex flex-wrap justify-start sm:justify-end gap-2">
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary admin-btn-compact"
                    onClick={() => void moveLesson(index, -1)}
                    disabled={isReordering || index === 0}
                    aria-label={`Move ${lesson.title} up`}
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary admin-btn-compact"
                    onClick={() => void moveLesson(index, 1)}
                    disabled={isReordering || index === items.length - 1}
                    aria-label={`Move ${lesson.title} down`}
                  >
                    Move down
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary admin-btn-compact"
                    onClick={() => startEdit(lesson)}
                  >
                    Edit
                  </button>
                  {(videoStatuses[getLessonKey(lesson)]?.processingStatus ??
                    lesson.videoProcessingStatus) === "failed" && (
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary admin-btn-compact"
                      onClick={() =>
                        void retryVideoProcessing(getLessonKey(lesson))
                      }
                    >
                      Retry video
                    </button>
                  )}
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

      <AdminEditModal
        open={formOpen}
        title={editingKey ? "Edit lesson" : "Add lesson"}
        context={`Course: ${courseSlug}`}
        description="Lesson details, video, and PDF are saved together. Closing this window cancels the draft."
        saveLabel={editingKey ? "Save lesson" : "Add lesson"}
        isSaving={isSaving}
        isDirty={
          JSON.stringify(form) !== formSnapshot ||
          Boolean(videoFile) ||
          Boolean(documentFile)
        }
        size="lg"
        onCancel={() => {
          if (
            (JSON.stringify(form) === formSnapshot &&
              !videoFile &&
              !documentFile) ||
            window.confirm("Discard the changes to this lesson?")
          ) {
            resetForm();
          }
        }}
        onSave={() => formRef.current?.requestSubmit()}
      >
      <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            id="lesson-id"
            name="lesson-id"
            label="Lesson short name"
            value={form.id}
            required
            onChange={(value) => updateForm("id", value)}
          />
          <FormField
            id="lesson-sheet-ref"
            name="lesson-sheet-ref"
            label="Lesson label"
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
          <div className="md:col-span-2">
            <ImageUploadField
              label="Preview image"
              value={form.previewImage}
              description="Optional image shown beside this lesson."
              page="courses"
              onChange={(value) => updateForm("previewImage", value)}
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="lesson-video"
              className="label-caps mb-2 block"
            >
              Lesson video
            </label>
            <p className="type-infill mb-4 text-charcoal-muted">
              Choose a common video file from your computer. It will be kept
              private and prepared for secure student viewing.
              {editingKey &&
                " Leave this empty to keep the currently uploaded video."}
            </p>
            <input
              id="lesson-video"
              type="file"
              accept="video/mp4,video/webm,video/ogg,video/quicktime"
              className="block w-full hairline-border bg-concrete px-4 py-3 type-infill file:mr-4 file:border-0 file:bg-charcoal file:px-4 file:py-2 file:text-concrete"
              disabled={isSaving}
              onChange={(event) => {
                setVideoFile(event.target.files?.[0] ?? null);
                setVideoUploadProgress(0);
                setVideoUploadPhase("sending");
              }}
            />
            {editingKey &&
              items.find((lesson) => getLessonKey(lesson) === editingKey)
                ?.videoAvailable && (
                <p className="type-infill mt-3 text-charcoal-muted">
                  A protected video is currently stored for this lesson.
                </p>
              )}
            {isSaving && videoFile && (
              <ProcessProgressBar
                className="mt-3"
                compact
                stepLabel={
                  videoUploadPhase === "storing"
                    ? "File received — writing to private R2. Stay on this page."
                    : "Sending file to the API"
                }
                progress={
                  videoUploadPhase === "storing"
                    ? undefined
                    : videoUploadProgress
                }
              />
            )}
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="lesson-document"
              className="label-caps mb-2 block"
            >
              Lesson PDF
            </label>
            <p className="type-infill mb-4 text-charcoal-muted">
              Optional private PDF for enrolled students (stored under docs/ in
              R2).
              {editingKey &&
                " Leave empty to keep the currently uploaded document."}
            </p>
            <input
              id="lesson-document"
              type="file"
              accept="application/pdf"
              className="block w-full hairline-border bg-concrete px-4 py-3 type-infill file:mr-4 file:border-0 file:bg-charcoal file:px-4 file:py-2 file:text-concrete"
              disabled={isSaving}
              onChange={(event) => {
                setDocumentFile(event.target.files?.[0] ?? null);
                setDocumentUploadProgress(0);
              }}
            />
            {editingKey &&
              items.find((lesson) => getLessonKey(lesson) === editingKey)
                ?.documentAvailable && (
                <p className="type-infill mt-3 text-charcoal-muted">
                  A private PDF is currently stored for this lesson.
                </p>
              )}
            {isSaving && documentFile && documentUploadProgress > 0 && (
              <ProcessProgressBar
                className="mt-3"
                compact
                stepLabel="Uploading private lesson PDF"
                progress={documentUploadProgress}
              />
            )}
          </div>
        </div>
        {error && <p className="type-infill text-clay">{error}</p>}
      </form>
      </AdminEditModal>

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
