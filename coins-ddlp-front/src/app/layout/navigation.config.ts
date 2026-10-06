import { Translations } from '../shared/interfaces/translations.interface';

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
    mobilePrimary: true,
  },
  {
    labelKey: 'pesetas',
    routerLink: '/pesetas',
    icon: 'pi pi-building-columns',
    group: 'collection',
    mobilePrimary: true,
  },
  {
    labelKey: 'ubicacion',
    routerLink: '/ubicacion',
    icon: 'pi pi-map-marker',
    group: 'collection',
    mobilePrimary: true,
  },
  {
    labelKey: 'estadisticas',
    routerLink: '/estadisticas',
    icon: 'pi pi-chart-bar',
    group: 'collection',
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
    adminOnly: true,
  },
];
