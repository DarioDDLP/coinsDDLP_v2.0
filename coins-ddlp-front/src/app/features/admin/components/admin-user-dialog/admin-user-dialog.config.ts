import { Translations } from '../../../../shared/interfaces/translations.interface';

export const getRoleOptions = (t: Translations['admin']) => [
  { label: t.roleUser, value: 'user' },
  { label: t.roleAdmin, value: 'admin' },
];
