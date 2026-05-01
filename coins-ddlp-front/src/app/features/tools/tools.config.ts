import { SelectOption } from '../../shared/components/select/select.component';
import { NavItem } from '../../shared/components/buttons-header/buttons-header.component';
import { LITERALS } from '../../shared/constants/literals';

export const STANDARD_FACE_VALUES = new Set([
  '1 Céntimo', '2 Céntimos', '5 Céntimos',
  '10 Céntimos', '20 Céntimos', '50 Céntimos',
  '1 Euro', '2 Euros',
]);

export const FACE_VALUE_OPTIONS: SelectOption[] = [
  ...STANDARD_FACE_VALUES,
  '2 Euros C',
].map(v => ({ label: v, value: v }));

export const MINT_OPTIONS_GERMANY: SelectOption[] = [
  { label: 'A — Berlín',    value: 'A' },
  { label: 'D — Múnich',    value: 'D' },
  { label: 'F — Stuttgart', value: 'F' },
  { label: 'G — Karlsruhe', value: 'G' },
  { label: 'J — Hamburgo',  value: 'J' },
];

export const TOOLS_NAV_ITEMS: NavItem[] = [
  { label: LITERALS.herramientas.navAddEuro,  routerLink: '/herramientas/añadir-euro', icon: 'pi pi-plus-circle' },
  { label: LITERALS.herramientas.navAddYear,  routerLink: '/herramientas/añadir-año',  icon: 'pi pi-copy' },
];
