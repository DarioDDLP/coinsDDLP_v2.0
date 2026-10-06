import { SelectOption } from '../../shared/components/select/select.component';
import { NavItem } from '../../shared/components/buttons-header/buttons-header.component';
import { Translations } from '../../shared/interfaces/translations.interface';

export const STANDARD_FACE_VALUES = new Set([
  '1 Céntimo',
  '2 Céntimos',
  '5 Céntimos',
  '10 Céntimos',
  '20 Céntimos',
  '50 Céntimos',
  '1 Euro',
  '2 Euros',
]);

export const FACE_VALUE_OPTIONS: SelectOption[] = [...STANDARD_FACE_VALUES, '2 Euros C'].map(
  (v) => ({ label: v, value: v }),
);

export const VARIANT_OPTIONS: SelectOption[] = [
  { label: 'LA', value: 'LA' },
  { label: 'LR', value: 'LR' },
];

export const VARIANT_FACE_VALUES = new Set(['2 Euros', '2 Euros C']);

export const MINT_OPTIONS_GERMANY: SelectOption[] = [
  { label: 'A — Berlín', value: 'A' },
  { label: 'D — Múnich', value: 'D' },
  { label: 'F — Stuttgart', value: 'F' },
  { label: 'G — Karlsruhe', value: 'G' },
  { label: 'J — Hamburgo', value: 'J' },
];

export const getToolsNavItems = (t: Translations['herramientas']): NavItem[] => [
  {
    label: t.navAddEuro,
    routerLink: '/herramientas/añadir-euro',
    icon: 'pi pi-plus-circle',
  },
  {
    label: t.navAddYear,
    routerLink: '/herramientas/añadir-año',
    icon: 'pi pi-copy',
  },
];
