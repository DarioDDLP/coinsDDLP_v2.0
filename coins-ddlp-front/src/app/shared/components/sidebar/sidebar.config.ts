import { LITERALS } from '../../constants/literals';

export interface SidebarItem {
  label: string;
  routerLink: string;
  country?: string;  // Usa CountryFlagComponent (circular, normalizado)
  imgUrl?: string;   // Imagen genérica (monedas, iconos personalizados)
  icon?: string;     // PrimeIcons
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: LITERALS.sidebar.euros, routerLink: '/euros', country: 'europa' },
  { label: LITERALS.sidebar.conmemorativas, routerLink: '/conmemorativas', imgUrl: 'assets/2-euros.png' },
  { label: LITERALS.sidebar.pesetas, routerLink: '/pesetas', country: 'españa' },
  { label: LITERALS.sidebar.estadisticas, routerLink: '/estadisticas', icon: 'pi pi-chart-bar' },
  { label: LITERALS.sidebar.ubicacion, routerLink: '/ubicacion', icon: 'pi pi-map-marker' },
];
