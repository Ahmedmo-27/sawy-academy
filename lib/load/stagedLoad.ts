export interface StagedStep<T> {
  label: string;
  run: () => Promise<T>;
}

export interface StagedLoadProgress {
  progress: number;
  stepLabel: string;
  completed: number;
  total: number;
}

export type StagedLoadCallback = (state: StagedLoadProgress) => void;

function reportProgress(
  onProgress: StagedLoadCallback | undefined,
  completed: number,
  total: number,
  stepLabel: string
) {
  onProgress?.({
    progress: total === 0 ? 100 : Math.round((completed / total) * 100),
    stepLabel,
    completed,
    total,
  });
}

/** Run steps in parallel; progress advances as each step completes. */
export async function runParallelStagedLoad<T extends readonly unknown[]>(
  steps: { [K in keyof T]: StagedStep<T[K]> },
  onProgress?: StagedLoadCallback
): Promise<T> {
  const total = steps.length;
  let completed = 0;

  reportProgress(onProgress, completed, total, steps[0]?.label ?? "Loading…");

  const results = await Promise.all(
    steps.map(async (step) => {
      try {
        return await step.run();
      } finally {
        completed += 1;
        reportProgress(onProgress, completed, total, step.label);
      }
    })
  );

  return results as unknown as T;
}

/** Run steps sequentially; progress advances before and after each step. */
export async function runSequentialStagedLoad<T extends readonly unknown[]>(
  steps: { [K in keyof T]: StagedStep<T[K]> },
  onProgress?: StagedLoadCallback
): Promise<T> {
  const total = steps.length;
  const results: unknown[] = [];

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    reportProgress(onProgress, index, total, step.label);
    results.push(await step.run());
    reportProgress(onProgress, index + 1, total, step.label);
  }

  return results as unknown as T;
}
