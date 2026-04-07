import { LITERALS } from '../../constants/literals';

export interface SidebarItem {
  label: string;
  routerLink: string;
  imgUrl?: string;
  icon?: string;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: LITERALS.sidebar.euros, routerLink: '/euros', imgUrl: 'assets/flags/european-flag.png' },
  { label: LITERALS.sidebar.conmemorativas, routerLink: '/conmemorativas', imgUrl: 'assets/2-euros.png' },
  { label: LITERALS.sidebar.pesetas, routerLink: '/pesetas', imgUrl: 'assets/flags/espana-flag.png' },
  { label: LITERALS.sidebar.estadisticas, routerLink: '/estadisticas', icon: 'pi pi-chart-bar' },
  { label: LITERALS.sidebar.ubicacion, routerLink: '/ubicacion', icon: 'pi pi-map-marker' },
];
