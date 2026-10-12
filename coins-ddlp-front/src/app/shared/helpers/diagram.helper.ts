/** Geometría de los diagramas SVG (Admin → Base de datos). Funciones puras. */

export interface DiagramRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Trazo curvo de `from` a `to` para un SVG: de lado a lado si las cajas no se solapan en
 * horizontal; si no (misma columna), de arriba abajo.
 */
export function connectorPath(from: DiagramRect, to: DiagramRect): string {
  const fromRight = from.x + from.width;
  const toRight = to.x + to.width;

  if (fromRight <= to.x || toRight <= from.x) {
    const leftToRight = fromRight <= to.x;
    const x1 = leftToRight ? fromRight : from.x;
    const x2 = leftToRight ? to.x : toRight;
    const y1 = from.y + from.height / 2;
    const y2 = to.y + to.height / 2;
    const mid = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
  }

  const downwards = from.y + from.height <= to.y;
  const x1 = from.x + from.width / 2;
  const x2 = to.x + to.width / 2;
  const y1 = downwards ? from.y + from.height : from.y;
  const y2 = downwards ? to.y : to.y + to.height;
  const mid = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;
}
