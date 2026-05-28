export type OwnerSlug = 'dario' | 'manolo' | 'both';

export interface Owner {
  id: string;
  name: string;
  slug: OwnerSlug;
}
