export const COLLECTIONS = {
  euros: 'euro',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
