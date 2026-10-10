export const environment = {
  production: false,
  // Registro de accesos: desactivado en local para no llenarlo con pruebas
  accessLog: false,
  supabase: {
    url: 'https://uvkvagoipxgagyupxoqd.supabase.co',
    anonKey: 'sb_publishable_TS_lHvmYOi-FuxPr1dYEBA_zaLokJ_n',
  },
  // Clave PrimeUI Community (gratuita, caduca 2027-10-02). Se verifica offline en el navegador.
  primeuiLicense:
    'eyJpZCI6IjlmMDNjYjg5LWM3N2YtNDE0My04MTM3LTczMDcyNjlkMTQ4MCIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3OTA5NjEwNjcsImV4cCI6MTgyMjQ5NzA2N30.zbKEg7nI16h9jUTSIBxiVNuEU7OQDYoJXp1aL33aaYY0D6jkdPThFlPspllGgCyD-XtUOh8GEZv2OPs1epgSCQ',
};
