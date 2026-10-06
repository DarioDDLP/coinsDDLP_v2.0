import { LITERALS } from '../shared/constants/literals';

export type NavGroup = 'collection' | 'management';

export interface NavItem {
  label: string;
  /** Etiqueta corta para la barra inferior de móvil (si difiere). */
  shortLabel?: string;
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
    label: LITERALS.nav.euros,
    routerLink: '/euros',
    icon: 'pi pi-euro',
    group: 'collection',
    mobilePrimary: true,
  },
  {
    label: LITERALS.nav.conmemorativas,
    shortLabel: LITERALS.nav.conmemorativasShort,
    routerLink: '/conmemorativas',
    icon: 'pi pi-star',
    group: 'collection',
    mobilePrimary: true,
  },
  {
    label: LITERALS.nav.pesetas,
    routerLink: '/pesetas',
    icon: 'pi pi-building-columns',
    group: 'collection',
    mobilePrimary: true,
  },
  {
    label: LITERALS.nav.ubicacion,
    routerLink: '/ubicacion',
    icon: 'pi pi-map-marker',
    group: 'collection',
    mobilePrimary: true,
  },
  {
    label: LITERALS.nav.estadisticas,
    routerLink: '/estadisticas',
    icon: 'pi pi-chart-bar',
    group: 'collection',
  },
  {
    label: LITERALS.nav.admin,
    routerLink: '/admin',
    icon: 'pi pi-shield',
    group: 'management',
    adminOnly: true,
  },
  {
    label: LITERALS.nav.tools,
    routerLink: '/herramientas',
    icon: 'pi pi-wrench',
    group: 'management',
    adminOnly: true,
  },
];
