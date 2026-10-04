/**
 * Clave de orden de una denominación de peseta.
 *
 * Usa faceValueESP cuando existe. Las denominaciones anteriores al sistema decimal
 * (cuartos, ochavos) y algunas pesetas fraccionarias no lo tienen en la base de datos,
 * así que se deduce del texto. El sistema antiguo va delante (valores negativos,
 * ordenados entre sí por su valor en cuartos) y después el decimal en pesetas.
 */
export function denominationSortKey(label: string, faceValueESP: number | null): number {
  if (faceValueESP !== null && faceValueESP !== undefined) return faceValueESP;

  const text = label.toLowerCase().trim();
  const amount = parseAmount(text);
  if (amount === null) return Number.MAX_SAFE_INTEGER;

  if (text.includes('ochavo')) return LEGACY_OFFSET + amount * 0.5;
  if (text.includes('cuarto')) return LEGACY_OFFSET + amount;
  if (text.includes('céntimo') || text.includes('centimo')) return amount / 100;
  return amount; // pesetas
}

/** Las denominaciones en cuartos/ochavos quedan por delante de cualquier valor decimal. */
const LEGACY_OFFSET = -1000;

const FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75 };

/** "2½ pesetas" → 2.5 · "½ cuarto" → 0.5 · "2,50 pesetas" → 2.5 · "4 cuartos" → 4 */
function parseAmount(text: string): number | null {
  const match = text.match(/^(\d+(?:[.,]\d+)?)?\s*([½¼¾])?/);
  if (!match || (!match[1] && !match[2])) return null;
  const whole = match[1] ? Number(match[1].replace(',', '.')) : 0;
  const fraction = match[2] ? FRACTIONS[match[2]] : 0;
  return whole + fraction;
}
