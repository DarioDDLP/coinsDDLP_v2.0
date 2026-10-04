import { LITERALS } from '../constants/literals';
import { EmptyPanelTone } from '../components/empty-panel/empty-panel.component';

export interface EmptyState {
  icon: string;
  title: string;
  tone: EmptyPanelTone;
  /** Hay búsqueda activa: el panel ofrece borrarla. */
  canClearSearch: boolean;
}

/**
 * Qué decir cuando una lista sale vacía, según el motivo:
 * búsqueda sin coincidencias › filtro "faltantes" (no falta ninguna) › filtro "obtenidas" › sin datos.
 */
export function getEmptyState(search: string, ownership = 'all'): EmptyState {
  const query = search.trim();
  if (query) {
    return {
      icon: 'pi-search',
      title: `${LITERALS.shared.emptySearchFor} «${query}»`,
      tone: 'neutral',
      canClearSearch: true,
    };
  }
  if (ownership === 'missing') {
    return {
      icon: 'pi-check-circle',
      title: LITERALS.shared.emptyMissing,
      tone: 'success',
      canClearSearch: false,
    };
  }
  if (ownership === 'owned') {
    return {
      icon: 'pi-inbox',
      title: LITERALS.shared.emptyOwned,
      tone: 'neutral',
      canClearSearch: false,
    };
  }
  return {
    icon: 'pi-inbox',
    title: LITERALS.shared.emptyData,
    tone: 'neutral',
    canClearSearch: false,
  };
}
