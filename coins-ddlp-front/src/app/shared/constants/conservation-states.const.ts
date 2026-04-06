import { ConservationState } from '../interfaces/conservation-state.interface';

export const CONSERVATION_STATES: ConservationState[] = [
  { code: 'ND',  name: 'No disponible',             description: 'Estado desconocido o no catalogado', severity: 'secondary' },
  { code: 'FDC', name: 'Flor de cuño',              description: 'Perfecta, sin ningún defecto',        severity: 'success'   },
  { code: 'SC',  name: 'Sin circular',              description: 'Sin circular, calidad de acuñación',  severity: 'success'   },
  { code: 'EBC', name: 'Excelente bien conservada', description: 'Muy ligero desgaste en relieves',     severity: 'info'      },
  { code: 'MBC', name: 'Muy bien conservada',       description: 'Ligero desgaste en puntos altos',     severity: 'info'      },
  { code: 'BC',  name: 'Bien conservada',           description: 'Desgaste moderado pero legible',      severity: 'warn'      },
  { code: 'RC',  name: 'Regular conservación',      description: 'Desgaste notable, detalles perdidos', severity: 'warn'      },
  { code: 'MC',  name: 'Mal conservada',            description: 'Muy desgastada, apenas identificable',severity: 'danger'    },
];

export const CONSERVATION_MAP = new Map(
  CONSERVATION_STATES.map(s => [s.code, s])
);
