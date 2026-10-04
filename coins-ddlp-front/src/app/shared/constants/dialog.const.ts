/** En móvil (<768px) los diálogos ocupan todo el ancho. Solo lo usa app-dialog. */
export const DIALOG_BREAKPOINTS = { '767px': 'calc(100vw - 24px)' };

export type DialogSize = 'sm' | 'md' | 'lg';

/** Ancho del diálogo en escritorio y tablet según su tamaño. */
export const DIALOG_WIDTHS: Record<DialogSize, string> = {
  sm: '400px',
  md: '440px',
  lg: '460px',
};
