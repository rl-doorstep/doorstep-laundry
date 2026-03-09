/**
 * Per-load wash options. Used when creating/updating orders and for customer default preferences.
 */
export type LoadOptionsInput = {
  hotWater?: boolean;
  bleach?: boolean;
  hypoallergenic?: boolean;
  delicateCycle?: boolean;
  scentFree?: boolean;
  coldWaterOnly?: boolean;
};

export const LOAD_OPTION_KEYS: (keyof LoadOptionsInput)[] = [
  "hotWater",
  "bleach",
  "hypoallergenic",
  "delicateCycle",
  "scentFree",
  "coldWaterOnly",
];

export const LOAD_OPTION_LABELS: Record<keyof LoadOptionsInput, string> = {
  hotWater: "Hot water",
  bleach: "Bleach",
  hypoallergenic: "Hypoallergenic",
  delicateCycle: "Delicate cycle",
  scentFree: "Scent-free",
  coldWaterOnly: "Cold water only",
};

/** Normalize to booleans for DB (default false). */
export function toOrderLoadOptions(
  input: LoadOptionsInput | null | undefined
): {
  hotWater: boolean;
  bleach: boolean;
  hypoallergenic: boolean;
  delicateCycle: boolean;
  scentFree: boolean;
  coldWaterOnly: boolean;
} {
  return {
    hotWater: Boolean(input?.hotWater),
    bleach: Boolean(input?.bleach),
    hypoallergenic: Boolean(input?.hypoallergenic),
    delicateCycle: Boolean(input?.delicateCycle),
    scentFree: Boolean(input?.scentFree),
    coldWaterOnly: Boolean(input?.coldWaterOnly),
  };
}

/** Load row with optional option booleans (from DB). */
export type LoadWithOptions = LoadOptionsInput & { loadNumber: number };

/** Return labels for options that are true on this load. */
export function getEnabledLoadOptionLabels(load: LoadOptionsInput): string[] {
  const labels: string[] = [];
  for (const key of LOAD_OPTION_KEYS) {
    if (load[key]) labels.push(LOAD_OPTION_LABELS[key]);
  }
  return labels;
}
