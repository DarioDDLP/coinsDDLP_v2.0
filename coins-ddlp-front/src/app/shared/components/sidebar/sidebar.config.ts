import { LITERALS } from '../../constants/literals';

export interface SidebarItem {
  label: string;
  routerLink: string;
  imgUrl: string;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: LITERALS.sidebar.euros, routerLink: '/euros', imgUrl: 'assets/flags/european-flag.png' },
  { label: LITERALS.sidebar.conmemorativas, routerLink: '/conmemorativas', imgUrl: 'assets/2-euros.png' },
  { label: LITERALS.sidebar.pesetas, routerLink: '/pesetas', imgUrl: 'assets/flags/espana-flag.png' },
  { label: LITERALS.sidebar.estadisticas, routerLink: '/estadisticas', imgUrl: 'assets/statistics.png' },
  { label: LITERALS.sidebar.ubicacion, routerLink: '/ubicacion', imgUrl: 'assets/book.png' },
];
