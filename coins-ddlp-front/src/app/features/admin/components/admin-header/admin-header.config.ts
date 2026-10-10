import { NavItem } from '../../../../shared/components/buttons-header/buttons-header.component';
import { Translations } from '../../../../shared/interfaces/translations.interface';

export const getAdminNavItems = (t: Translations['admin']): NavItem[] => [
  { label: t.navUsers, routerLink: '/admin/usuarios', icon: 'pi pi-users' },
  { label: t.navLog, routerLink: '/admin/registro', icon: 'pi pi-history' },
];
