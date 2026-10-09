import { Translations } from '../interfaces/translations.interface';

/**
 * Permisos que el admin concede a cada usuario o al perfil Invitado.
 * Deben coincidir con `VALID_PERMISSIONS` de la Edge Function `admin-users`
 * y con las claves usadas en las políticas RLS (`has_permission`).
 */
export const PERMISSIONS = [
  'euros.units.editOwn',
  'euros.units.editAny',
  'euros.catalog.edit',
  'euros.delete',
  'tools.addEuro',
  'tools.addYear',
  'location.create',
  'location.update',
  'location.delete',
  'location.viewInLists',
  'export.excel',
  'collection.switch',
  'section.estadisticas',
  'section.ubicacion',
  'section.pesetas',
  'section.conmemorativas',
  'numista.quotaView',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Permisos que admite el perfil Invitado: solo de consulta (sin sesión no se
 * puede escribir en la BD). Debe coincidir con `GUEST_PERMISSIONS` de `admin-users`.
 */
export const GUEST_PERMISSIONS: readonly Permission[] = [
  'location.viewInLists',
  'export.excel',
  'collection.switch',
  'section.estadisticas',
  'section.ubicacion',
  'section.pesetas',
  'section.conmemorativas',
  'numista.quotaView',
];

type PermissionLabels = Translations['admin']['permissions'];

export interface PermissionGroup {
  labelKey: keyof PermissionLabels['groups'];
  permissions: Permission[];
}

/** Agrupación de los interruptores en el diálogo de usuario. */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    labelKey: 'euros',
    permissions: [
      'euros.units.editOwn',
      'euros.units.editAny',
      'euros.catalog.edit',
      'euros.delete',
    ],
  },
  { labelKey: 'tools', permissions: ['tools.addEuro', 'tools.addYear'] },
  {
    labelKey: 'location',
    permissions: ['location.create', 'location.update', 'location.delete', 'location.viewInLists'],
  },
  {
    labelKey: 'consult',
    permissions: ['export.excel', 'collection.switch', 'numista.quotaView'],
  },
  {
    labelKey: 'sections',
    permissions: [
      'section.conmemorativas',
      'section.pesetas',
      'section.ubicacion',
      'section.estadisticas',
    ],
  },
];

/** Clave del texto de cada permiso en `admin.permissions.items` (sin puntos). */
export function getPermissionLabelKey(p: Permission): keyof PermissionLabels['items'] {
  return p.replace(/\./g, '_') as keyof PermissionLabels['items'];
}
