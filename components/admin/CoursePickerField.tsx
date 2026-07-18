"use client";

import { listCourses } from "@/lib/api/courses";
import { useEffect, useState } from "react";
import { AdminLoader } from "@/components/admin/AdminLoader";

interface CoursePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

interface CourseOption {
  key: string;
  title: string;
}

export function CoursePickerField({
  label,
  value,
  onChange,
  error,
}: CoursePickerFieldProps) {
  const [options, setOptions] = useState<CourseOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const selected = new Set(
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError("");

      try {
        const courses = await listCourses();
        if (cancelled) return;

        setOptions(
          courses.map((course) => ({
            key: course._id ?? course.id,
            title: course.title,
          }))
        );
      } catch {
        if (!cancelled) {
          setLoadError("We couldn't load the course list. You can still save the group details.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(key: string) {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(Array.from(next).join(", "));
  }

  return (
    <div className="md:col-span-2">
      <p className="label-caps mb-2">{label}</p>
      <p className="type-infill mb-4 text-charcoal-muted">
        Tick the courses that belong in this group.
      </p>

      {isLoading && <AdminLoader label="Loading courses" />}

      {!isLoading && loadError && (
        <p className="type-infill text-clay">{loadError}</p>
      )}

      {!isLoading && !loadError && options.length === 0 && (
        <p className="type-infill text-charcoal-muted">
          No courses available yet. Add courses first, then come back here.
        </p>
      )}

      {!isLoading && options.length > 0 && (
        <ul className="hairline-border divide-y divide-hairline bg-concrete">
          {options.map((option) => {
            const checked = selected.has(option.key);
            return (
              <li key={option.key}>
                <label className="flex cursor-pointer items-center gap-4 px-4 py-4 hover:bg-concrete-dark/40">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[var(--color-clay)]"
                    checked={checked}
                    onChange={() => toggle(option.key)}
                  />
                  <span className="type-body text-charcoal">{option.title}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="type-infill mt-2 text-clay">{error}</p>}
    </div>
  );
}
