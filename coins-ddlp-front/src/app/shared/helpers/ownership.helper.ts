/** Una moneda cuenta como "tengo" con unidades; en modo ambas, si la tienen los dos. */
export function isOwned(uds: number, udsAlt: number | undefined, both: boolean): boolean {
  return both ? uds > 0 && (udsAlt ?? 0) > 0 : uds > 0;
}
