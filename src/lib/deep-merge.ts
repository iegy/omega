function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPrimitive(value: unknown): boolean {
  const type = typeof value;
  return type === "string" || type === "number" || type === "boolean";
}

/**
 * Type-preserving deep merge used for the site settings tree (spec 16).
 *
 * Behaviour is deliberately conservative because the override comes from
 * Firestore, which anyone with dashboard access can edit:
 *
 *  - Only keys that exist in `base` are considered; unknown keys are ignored, so
 *    a stray console field can never appear in the app.
 *  - Nested objects merge recursively, which is why a document holding just
 *    `{ contact: { phone } }` does not wipe out the rest of the tree.
 *  - An override value must be type-compatible with the default; otherwise the
 *    default wins. A mistyped field degrades to the fallback instead of
 *    crashing a page.
 *  - An explicit `null` IS honoured — that is how the dashboard clears an
 *    optional value such as a maps URL.
 */
export function deepMergeSettings<T extends Record<string, unknown>>(
  base: T,
  override: unknown,
): T {
  if (!isPlainObject(override)) return base;

  const output: Record<string, unknown> = { ...base };

  for (const [key, baseValue] of Object.entries(base)) {
    if (!(key in override)) continue;
    const overrideValue = override[key];

    if (overrideValue === undefined) continue;

    if (isPlainObject(baseValue)) {
      output[key] = isPlainObject(overrideValue)
        ? deepMergeSettings(baseValue, overrideValue)
        : baseValue;
      continue;
    }

    if (Array.isArray(baseValue)) {
      output[key] = Array.isArray(overrideValue) ? overrideValue : baseValue;
      continue;
    }

    if (overrideValue === null) {
      output[key] = null;
      continue;
    }

    // `baseValue === null` means the field is optional in the defaults, so any
    // primitive is acceptable; otherwise the types have to line up.
    const compatible =
      baseValue === null ? isPrimitive(overrideValue) : typeof overrideValue === typeof baseValue;

    if (compatible) output[key] = overrideValue;
  }

  return output as T;
}
