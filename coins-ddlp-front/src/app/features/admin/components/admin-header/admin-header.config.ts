import { NavItem } from '../../../../shared/components/buttons-header/buttons-header.component';
import { LITERALS } from '../../../../shared/constants/literals';

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: LITERALS.admin.navUsers, routerLink: '/admin/usuarios', icon: 'pi pi-users' },
];
