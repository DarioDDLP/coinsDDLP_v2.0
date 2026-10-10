/** Colección de euros de un usuario (`id` = su `auth.uid()`). */
export interface Owner {
  id: string;
  name: string;
  /** Colección que ven los visitantes y quien no puede cambiar de colección. */
  isDefault: boolean;
}

/** Colecciones elegidas en el selector: la principal y, opcionalmente, otra para comparar. */
export interface OwnerSelection {
  primary: string | null;
  compare: string | null;
}
