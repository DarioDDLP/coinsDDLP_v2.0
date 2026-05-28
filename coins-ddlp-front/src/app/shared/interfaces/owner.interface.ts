export type OwnerSlug = 'dario' | 'manolo' | 'ambas';

export interface Owner {
  id: string;
  name: string;
  slug: OwnerSlug;
}
