/**
 * Level-gate helpers for CourseGroup.type === "leveled".
 *
 * Lock rule: a level is locked when order > 1 AND the previous level
 * (order - 1) is not completed. Guests see Level 2+ as locked with
 * sign-in copy rather than assuming any completion state.
 */

export type LevelAccessState =
  | "locked"
  | "unlocked_not_started"
  | "unlocked_in_progress"
  | "unlocked_completed";

export interface LevelProgressRecord {
  courseId: string;
  courseSlug: string;
  /** True when the user has finished every lesson in this level */
  completed: boolean;
  /** 0–1 fraction of lessons completed; used when not completed */
  progress?: number;
}

export interface ResolveLevelAccessInput {
  /** 1-based order of this level within the track */
  levelOrder: number;
  isAuthenticated: boolean;
  /** Whether the level at order (levelOrder - 1) is completed */
  previousLevelCompleted: boolean;
  current?: LevelProgressRecord | null;
}

export interface LevelAccessResult {
  state: LevelAccessState;
  locked: boolean;
  /** Prerequisite / sign-in copy when locked; undefined when unlocked */
  message?: string;
  progress: number;
}

/**
 * Dynamic prerequisite copy from the immediately preceding level order.
 * Never hardcodes level numbers beyond computing order - 1.
 */
export function getPrerequisiteMessage(
  levelOrder: number,
  isAuthenticated: boolean
): string | undefined {
  if (levelOrder <= 1) return undefined;
  const previous = levelOrder - 1;
  if (!isAuthenticated) {
    return `Sign in and complete Level ${previous} to unlock`;
  }
  return `Complete Level ${previous} first`;
}

/**
 * Pure lock check — level.order > 1 AND previous level not completed.
 * Guests are treated as having no completions (previousLevelCompleted = false).
 */
export function isLevelLocked(
  levelOrder: number,
  previousLevelCompleted: boolean
): boolean {
  return levelOrder > 1 && !previousLevelCompleted;
}

export function resolveLevelAccess({
  levelOrder,
  isAuthenticated,
  previousLevelCompleted,
  current,
}: ResolveLevelAccessInput): LevelAccessResult {
  const locked = isLevelLocked(levelOrder, previousLevelCompleted);

  if (locked) {
    return {
      state: "locked",
      locked: true,
      message: getPrerequisiteMessage(levelOrder, isAuthenticated),
      progress: 0,
    };
  }

  if (current?.completed) {
    return {
      state: "unlocked_completed",
      locked: false,
      progress: 1,
    };
  }

  const progress = clampProgress(current?.progress ?? 0);
  if (progress > 0) {
    return {
      state: "unlocked_in_progress",
      locked: false,
      progress,
    };
  }

  return {
    state: "unlocked_not_started",
    locked: false,
    progress: 0,
  };
}

function clampProgress(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Look up whether the level at `order` is completed in a progress map.
 */
export function isLevelCompleted(
  progressByOrder: Map<number, LevelProgressRecord>,
  order: number
): boolean {
  return progressByOrder.get(order)?.completed === true;
}

/**
 * Build an order → progress map from a flat list of records and the
 * track's ordered course ids/slugs.
 */
export function indexProgressByOrder(
  levels: Array<{ order: number; courseId: string; courseSlug: string }>,
  records: LevelProgressRecord[]
): Map<number, LevelProgressRecord> {
  const byId = new Map(records.map((r) => [r.courseId, r]));
  const bySlug = new Map(records.map((r) => [r.courseSlug, r]));
  const map = new Map<number, LevelProgressRecord>();

  for (const level of levels) {
    const record =
      byId.get(level.courseId) ?? bySlug.get(level.courseSlug) ?? null;
    if (record) {
      map.set(level.order, record);
    }
  }

  return map;
}

/**
 * Stub for GET /api/users/me/progress (or enrollments mapped to levels).
 * Returns no completions until a real endpoint is wired.
 *
 * TODO: Replace with fetch to /api/users/me/progress or listMyEnrollments()
 * filtered to this track's course ids, mapping Enrollment.completed → completed.
 */
export function stubTrackProgress(
  _trackSlug: string,
  _courseIds: string[]
): LevelProgressRecord[] {
  return [];
}
