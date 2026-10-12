import {
  DbAccessRule,
  DbGroup,
  DbProcess,
  DbRelation,
  DbTable,
} from '../../../shared/interfaces/db-schema.interface';

/**
 * Mapa de la base de datos para Admin → Base de datos. Es una descripción fija: al añadir o cambiar
 * tablas, columnas, relaciones o políticas RLS en `supabase/migrations/` hay que actualizarla aquí
 * (y sus textos en `admin.db.tables` de los JSON de idiomas; los recuentos, en `db_table_counts()`).
 */

const PUBLIC: DbAccessRule[] = [{ level: 'public' }];
const ADMIN: DbAccessRule[] = [{ level: 'admin' }];
const SERVICE: DbAccessRule[] = [{ level: 'service' }];
const NONE: DbAccessRule[] = [{ level: 'none' }];
/** Solicitudes de intercambio: se crean con la función `trade_request_create`. */
const TRADE: DbAccessRule[] = [{ level: 'permission', permissions: ['trade.request'] }];
const UNITS: DbAccessRule[] = [
  { level: 'self', permissions: ['euros.units.editOwn'] },
  { level: 'permission', permissions: ['euros.units.editAny'] },
];

/** Columnas del diagrama: x de cada una y ancho de las tarjetas. */
export const DB_DIAGRAM = {
  columns: [20, 320, 620, 920],
  cardWidth: 240,
  headerHeight: 34,
  rowHeight: 22,
  paddingBottom: 8,
  processY: 740,
  processHeight: 56,
  width: 1180,
  height: 816,
} as const;

const [C0, C1, C2, C3] = DB_DIAGRAM.columns;

export const DB_GROUPS: DbGroup[] = [
  'catalog',
  'collections',
  'pesetas',
  'location',
  'permissions',
  'accessLog',
  'numista',
  'auth',
];

export const DB_TABLES: DbTable[] = [
  {
    name: 'euro',
    sqlName: 'euro',
    group: 'catalog',
    x: C0,
    y: 20,
    columns: [
      { name: 'id', type: 'text', pk: true },
      { name: 'country', type: 'text', nullable: true, inDiagram: true },
      { name: 'year', type: 'integer', nullable: true, inDiagram: true },
      { name: 'faceValue', type: 'text', nullable: true, inDiagram: true },
      { name: 'mint', type: 'text', nullable: true },
      { name: 'description', type: 'text', nullable: true },
      { name: 'commemorative', type: 'boolean', nullable: true },
      { name: 'circulation', type: 'boolean', nullable: true },
      { name: 'idNum', type: 'text', nullable: true, inDiagram: true },
      { name: 'variant', type: 'text', nullable: true },
    ],
    access: {
      select: PUBLIC,
      insert: [{ level: 'permission', permissions: ['tools.addEuro', 'tools.addYear'] }],
      update: [{ level: 'permission', permissions: ['euros.catalog.edit'] }],
      delete: [{ level: 'permission', permissions: ['euros.delete'] }],
    },
  },
  {
    name: 'euro_ownership',
    sqlName: 'euro_ownership',
    group: 'collections',
    x: C1,
    y: 20,
    columns: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'euroId', type: 'text', fk: 'euro' },
      { name: 'ownerId', type: 'uuid', fk: 'owner' },
      { name: 'uds', type: 'integer', inDiagram: true },
      { name: 'conservation', type: 'text', nullable: true, inDiagram: true },
      { name: 'observations', type: 'text', nullable: true },
      { name: 'tradeHidden', type: 'boolean' },
    ],
    access: { select: PUBLIC, insert: UNITS, update: UNITS, delete: UNITS },
  },
  {
    name: 'owner',
    sqlName: 'owner',
    group: 'collections',
    x: C2,
    y: 20,
    columns: [
      { name: 'id', type: 'uuid', pk: true, fk: 'auth_users' },
      { name: 'name', type: 'text', inDiagram: true },
      { name: 'isDefault', type: 'boolean', inDiagram: true },
    ],
    access: { select: PUBLIC, insert: SERVICE, update: SERVICE, delete: SERVICE },
  },
  {
    name: 'user_permission',
    sqlName: 'user_permission',
    group: 'permissions',
    x: C3,
    y: 20,
    columns: [
      { name: 'userId', type: 'uuid', pk: true, fk: 'auth_users' },
      { name: 'permission', type: 'text', pk: true },
    ],
    access: { select: [{ level: 'self' }], insert: SERVICE, update: SERVICE, delete: SERVICE },
  },
  {
    name: 'guest_permission',
    sqlName: 'guest_permission',
    group: 'permissions',
    x: C3,
    y: 140,
    columns: [{ name: 'permission', type: 'text', pk: true }],
    access: { select: PUBLIC, insert: SERVICE, update: SERVICE, delete: SERVICE },
  },
  {
    name: 'country_location',
    sqlName: 'country_location',
    group: 'location',
    x: C0,
    y: 220,
    columns: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'country', type: 'text', inDiagram: true },
      { name: 'album', type: 'integer', inDiagram: true },
      { name: 'yearFrom', type: 'integer' },
      { name: 'yearTo', type: 'integer', nullable: true },
      { name: 'isClosed', type: 'boolean', inDiagram: true },
    ],
    access: {
      select: PUBLIC,
      insert: [{ level: 'permission', permissions: ['location.create'] }],
      update: [{ level: 'permission', permissions: ['location.update'] }],
      delete: [{ level: 'permission', permissions: ['location.delete'] }],
    },
  },
  {
    name: 'numista_usage',
    sqlName: 'numista_usage',
    group: 'numista',
    x: C1,
    y: 220,
    columns: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'idnum', type: 'text', inDiagram: true },
      { name: 'called_at', type: 'timestamptz', nullable: true, inDiagram: true },
    ],
    access: {
      select: [{ level: 'authenticated' }],
      insert: SERVICE,
      update: NONE,
      delete: NONE,
    },
  },
  {
    name: 'auth_users',
    sqlName: 'auth.users',
    group: 'auth',
    external: true,
    x: C2,
    y: 210,
    columns: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'email', type: 'text', inDiagram: true },
      { name: 'raw_app_meta_data', type: 'jsonb', inDiagram: true },
      { name: 'raw_user_meta_data', type: 'jsonb' },
      { name: 'last_sign_in_at', type: 'timestamptz', nullable: true },
    ],
    access: { select: SERVICE, insert: SERVICE, update: SERVICE, delete: SERVICE },
  },
  {
    name: 'trade_request',
    sqlName: 'trade_request',
    group: 'collections',
    x: C3,
    y: 230,
    columns: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'requesterId', type: 'uuid', fk: 'auth_users' },
      { name: 'requesterName', type: 'text' },
      { name: 'ownerId', type: 'uuid', fk: 'owner' },
      { name: 'kind', type: 'text' },
      { name: 'status', type: 'text', inDiagram: true },
      { name: 'message', type: 'text', nullable: true },
      { name: 'response', type: 'text', nullable: true },
      { name: 'createdAt', type: 'timestamptz' },
      { name: 'updatedAt', type: 'timestamptz' },
      { name: 'ownerSeen', type: 'boolean' },
      { name: 'requesterSeen', type: 'boolean' },
    ],
    access: {
      select: [{ level: 'self' }],
      insert: TRADE,
      update: [{ level: 'self' }],
      delete: NONE,
    },
  },
  {
    name: 'trade_request_item',
    sqlName: 'trade_request_item',
    group: 'collections',
    x: C3,
    y: 390,
    columns: [
      { name: 'requestId', type: 'uuid', pk: true, fk: 'trade_request' },
      { name: 'euroId', type: 'text', pk: true, fk: 'euro' },
      { name: 'quantity', type: 'integer', inDiagram: true },
    ],
    access: { select: [{ level: 'self' }], insert: TRADE, update: NONE, delete: NONE },
  },
  {
    name: 'peseta_type',
    sqlName: 'peseta_type',
    group: 'pesetas',
    x: C0,
    y: 540,
    columns: [
      { name: 'idNum', type: 'integer', pk: true },
      { name: 'title', type: 'text', inDiagram: true },
      { name: 'faceValueLabel', type: 'text', inDiagram: true },
      { name: 'minYear', type: 'integer', inDiagram: true },
      { name: 'maxYear', type: 'integer', inDiagram: true },
      { name: 'faceValueESP', type: 'numeric', nullable: true },
      { name: 'composition', type: 'text' },
      { name: 'weightG', type: 'numeric', nullable: true },
      { name: 'diameterMm', type: 'numeric', nullable: true },
      { name: 'ruler', type: 'text', nullable: true },
      { name: 'imageObverse', type: 'text' },
      { name: 'imageReverse', type: 'text' },
      { name: 'descriptionObverse', type: 'text', nullable: true },
      { name: 'descriptionReverse', type: 'text', nullable: true },
    ],
    access: { select: PUBLIC, insert: ADMIN, update: ADMIN, delete: ADMIN },
  },
  {
    name: 'peseta',
    sqlName: 'peseta',
    group: 'pesetas',
    x: C1,
    y: 540,
    columns: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'pesetaTypeId', type: 'integer', fk: 'peseta_type' },
      { name: 'label', type: 'text', inDiagram: true },
      { name: 'designYear', type: 'integer' },
      { name: 'mintYear', type: 'integer' },
      { name: 'mintage', type: 'bigint', nullable: true },
      { name: 'uds', type: 'integer', inDiagram: true },
      { name: 'conservation', type: 'text', nullable: true, inDiagram: true },
      { name: 'observations', type: 'text', nullable: true },
    ],
    access: { select: PUBLIC, insert: ADMIN, update: ADMIN, delete: ADMIN },
  },
  {
    name: 'access_visit',
    sqlName: 'access_visit',
    group: 'accessLog',
    x: C2,
    y: 540,
    columns: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'startedAt', type: 'timestamptz', inDiagram: true },
      { name: 'lastSeenAt', type: 'timestamptz' },
      { name: 'userId', type: 'uuid', nullable: true, fk: 'auth_users' },
      { name: 'userName', type: 'text', nullable: true },
      { name: 'ip', type: 'text', nullable: true, inDiagram: true },
      { name: 'country', type: 'text', nullable: true },
      { name: 'city', type: 'text', nullable: true },
      { name: 'browser', type: 'text', nullable: true },
      { name: 'os', type: 'text', nullable: true },
      { name: 'deviceType', type: 'text', nullable: true, inDiagram: true },
      { name: 'landingPath', type: 'text', nullable: true },
      { name: 'appVersion', type: 'text', nullable: true },
    ],
    access: {
      select: ADMIN,
      insert: SERVICE,
      update: SERVICE,
      delete: [{ level: 'admin' }, { level: 'service' }],
    },
  },
  {
    name: 'access_event',
    sqlName: 'access_event',
    group: 'accessLog',
    x: C3,
    y: 540,
    columns: [
      { name: 'id', type: 'bigint', pk: true },
      { name: 'visitId', type: 'uuid', fk: 'access_visit' },
      { name: 'at', type: 'timestamptz', inDiagram: true },
      { name: 'type', type: 'text', inDiagram: true },
      { name: 'path', type: 'text', nullable: true },
      { name: 'userId', type: 'uuid', nullable: true, fk: 'auth_users' },
      { name: 'detail', type: 'text', nullable: true },
    ],
    access: { select: ADMIN, insert: SERVICE, update: NONE, delete: ADMIN },
  },
];

export const DB_RELATIONS: DbRelation[] = [
  { from: 'euro_ownership', column: 'euroId', to: 'euro', onDelete: 'cascade' },
  { from: 'euro_ownership', column: 'ownerId', to: 'owner', onDelete: 'cascade' },
  { from: 'owner', column: 'id', to: 'auth_users', onDelete: 'cascade' },
  { from: 'user_permission', column: 'userId', to: 'auth_users', onDelete: 'cascade' },
  { from: 'access_visit', column: 'userId', to: 'auth_users', onDelete: 'setNull' },
  { from: 'access_event', column: 'visitId', to: 'access_visit', onDelete: 'cascade' },
  { from: 'access_event', column: 'userId', to: 'auth_users', onDelete: 'setNull' },
  { from: 'peseta', column: 'pesetaTypeId', to: 'peseta_type', onDelete: 'restrict' },
  { from: 'trade_request', column: 'requesterId', to: 'auth_users', onDelete: 'cascade' },
  { from: 'trade_request', column: 'ownerId', to: 'owner', onDelete: 'cascade' },
  { from: 'trade_request_item', column: 'requestId', to: 'trade_request', onDelete: 'cascade' },
  { from: 'trade_request_item', column: 'euroId', to: 'euro', onDelete: 'cascade' },
];

export const DB_PROCESSES: DbProcess[] = [
  { name: 'numistaProxy', writes: ['numista_usage'] },
  {
    name: 'adminUsers',
    writes: ['auth_users', 'user_permission', 'guest_permission', 'owner'],
  },
  { name: 'accessLog', writes: ['access_visit', 'access_event'] },
  { name: 'retention', writes: ['access_visit', 'access_event'] },
];
