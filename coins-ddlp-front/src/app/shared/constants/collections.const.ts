export const TABLES = {
  euro: 'euro',
  peseta: 'peseta',
  pesetaType: 'peseta_type',
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];

// Mantener compatibilidad hacia atrás (si es necesario)
export const COLLECTIONS = TABLES;
export type CollectionName = TableName;
