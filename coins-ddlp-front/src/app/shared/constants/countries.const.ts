/**
 * Países por código ISO 3166-1 alfa-3 (EUE: código reservado para la UE) con el nombre
 * tal como lo guarda la BD. El código da la bandera (`public/assets/flags/{iso3}.png`)
 * y el nombre visible en cada idioma (`countries.<ISO3>` en `public/i18n/*.json`).
 */
export const COUNTRY_DB_NAMES = {
  AND: 'Andorra',
  AUT: 'Austria',
  BEL: 'Bélgica',
  BGR: 'Bulgaria',
  CYP: 'Chipre',
  DEU: 'Alemania',
  ESP: 'España',
  EST: 'Estonia',
  EUE: 'Europa',
  FIN: 'Finlandia',
  FRA: 'Francia',
  GRC: 'Grecia',
  HRV: 'Croacia',
  IRL: 'Irlanda',
  ITA: 'Italia',
  LTU: 'Lituania',
  LUX: 'Luxemburgo',
  LVA: 'Letonia',
  MCO: 'Mónaco',
  MLT: 'Malta',
  NLD: 'Holanda',
  PRT: 'Portugal',
  SMR: 'San Marino',
  SVK: 'Eslovaquia',
  SVN: 'Eslovenia',
  VAT: 'Vaticano',
} as const;
