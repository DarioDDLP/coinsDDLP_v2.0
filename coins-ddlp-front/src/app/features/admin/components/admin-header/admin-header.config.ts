import { LITERALS } from "../../../../shared/constants/literals";


export interface AdminNavItem {
  label: string;
  routerLink: string;
  icon: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: LITERALS.admin.navUsers, routerLink: '/admin/usuarios', icon: 'pi pi-users' },
];
