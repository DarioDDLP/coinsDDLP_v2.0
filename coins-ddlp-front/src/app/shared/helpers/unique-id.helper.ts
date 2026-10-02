let counter = 0;

/** Id único para asociar <label for> con su control en componentes reutilizables. */
export function uniqueId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
