import { Translations } from '../shared/interfaces/translations.interface';
import { Permission } from '../shared/constants/permissions.const';

type NavLabelKey = keyof Translations['nav'];

export type NavGroup = 'collection' | 'management';

export interface NavItem {
  /** Clave del texto en la sección `nav` de los diccionarios. */
  labelKey: NavLabelKey;
  /** Etiqueta corta para la barra inferior de móvil (si difiere). */
  shortLabelKey?: NavLabelKey;
  routerLink: string;
  icon: string;
  group: NavGroup;
  adminOnly?: boolean;
  /** Visible si el usuario tiene alguno de estos permisos. */
  permissions?: Permission[];
  /** Pestaña fija en la barra inferior de móvil; el resto va al panel "Más". */
  mobilePrimary?: boolean;
}

export const NUMISTA_MONTHLY_QUOTA = 2000;

export const NAV_ITEMS: NavItem[] = [
  {
    labelKey: 'euros',
    routerLink: '/euros',
    icon: 'pi pi-euro',
    group: 'collection',
    mobilePrimary: true,
  },
  {
    labelKey: 'conmemorativas',
    shortLabelKey: 'conmemorativasShort',
    routerLink: '/conmemorativas',
    icon: 'pi pi-star',
    group: 'collection',
    permissions: ['section.conmemorativas'],
    mobilePrimary: true,
  },
  {
    labelKey: 'pesetas',
    routerLink: '/pesetas',
    icon: 'pi pi-building-columns',
    group: 'collection',
    permissions: ['section.pesetas'],
    mobilePrimary: true,
  },
  {
    labelKey: 'ubicacion',
    routerLink: '/ubicacion',
    icon: 'pi pi-map-marker',
    group: 'collection',
    permissions: ['section.ubicacion'],
    mobilePrimary: true,
  },
  {
    labelKey: 'estadisticas',
    routerLink: '/estadisticas',
    icon: 'pi pi-chart-bar',
    group: 'collection',
    permissions: ['section.estadisticas'],
  },
  {
    labelKey: 'admin',
    routerLink: '/admin',
    icon: 'pi pi-shield',
    group: 'management',
    adminOnly: true,
  },
  {
    labelKey: 'tools',
    routerLink: '/herramientas',
    icon: 'pi pi-wrench',
    group: 'management',
    permissions: ['tools.addEuro', 'tools.addYear'],
  },
];

/** Si el elemento de navegación se muestra con el rol y los permisos actuales. */
export function isNavItemVisible(
  item: NavItem,
  isAdmin: boolean,
  granted: ReadonlySet<Permission>,
): boolean {
  if (item.adminOnly && !isAdmin) return false;
  return !item.permissions || item.permissions.some((p) => granted.has(p));
}
