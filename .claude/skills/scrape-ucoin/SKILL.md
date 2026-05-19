---
name: scrape-ucoin
description: Scrapes euro coin mintage data from ucoin.net for a given year. Outputs Excel with Unc/BU/Proof por denominación. Uses Safari + AppleScript (required for Cloudflare bypass).
---

## Uso

```
/scrape-ucoin YEAR [COUNTRY]
```

- `YEAR` — requerido
- `COUNTRY` — opcional, en español o inglés (`alemania`, `germany`, `españa`…).
  Si se omite o es `all`, procesa las 25 entidades de la eurozona.

Ejemplos: `/scrape-ucoin 2025 spain` · `/scrape-ucoin 2025 alemania` · `/scrape-ucoin 2025 all`

---

## Script

Ruta: `scripts/scrape_ucoin.py` (relativa a la raíz del proyecto coinsDDLP_v2.0).

Antes de ejecutar, verificar que existe (`ls`). Si no existe, recrearlo desde esta
SKILL.md — toda la lógica necesaria está documentada abajo. No pedir confirmación.

Ejecutar (en background; un `all` tarda ~25 min):
```bash
python3 scripts/scrape_ucoin.py YEAR [COUNTRY]
```

Requiere `openpyxl` (`pip3 install openpyxl`).

---

## Cómo funciona

### 1. Cloudflare y anti-scraping
ucoin.net usa Cloudflare Managed Challenge. **Solo funciona Safari + AppleScript**
(`curl`/`WebFetch`/Playwright → 403). Las páginas son SSR: `source of front document`
devuelve el HTML completo. La cookie `cf_clearance` de Safari se reusa entre páginas
— la 1ª carga espera más (10s), las siguientes 6s.

⚠️ **ucoin bloquea la IP por exceso de peticiones.** Las esperas de la skill (6-11s
entre páginas) están calibradas para parecer humanas; respetarlas es lo que evita el
bloqueo. **NUNCA depurar la skill a base de ráfagas de peticiones** (bucles XHR,
reintentos masivos): eso dispara el anti-bot, que sirve una página "Oops! ... your IP
is blocked" con cuenta atrás y, antes de eso, envenena las respuestas con monedas
aleatorias equivocadas. El bloqueo escala con la reincidencia. El script detecta esa
página y aborta (`abort_if_ip_blocked`); si pasa, dejar enfriar la IP unas horas
—mejor al día siguiente— y ejecutar la skill UNA sola vez, sin peticiones extra.

### 2. Auto-descubrimiento de tids (todos los países)
No hay tids hardcodeados — cada país se descubre en vivo, en 2 pasos:
1. Cargar `https://es.ucoin.net/catalog/?country={slug}` y extraer el ID del período
   cuyo `title` contiene "Euro" (`country={slug}&amp;period=(\d+)" title="...Euro..."`).
   Cada país tiene un ID de período distinto.
2. Cargar `https://es.ucoin.net/catalog/?country={slug}&period={euro_period}` y extraer
   las URLs `href="/coin/({slug}-...)/?tid=(\d+)"`. Para cada una de las 8 denominaciones
   (1,2,5,10,20,50 cent, 1€, 2€) elegir el diseño más reciente = mayor año de fin del slug.
   Usar `fullmatch` con `{slug}-{denom}-\d{4}-\d{4}` para que `1-euro` no capture `1-euro-cent`.

Se guarda por denominación: `(slug_prefix, start_year, end_year, tid, face_value)`.

### 3. Scraping de la tirada
Para cada denominación, URL de la página de tipo:
`https://es.ucoin.net/coin/{slug_prefix}-{start_year}-{end_year}/?tid={tid}`
- `end_year` del descubrimiento va primero; como fallback se prueban el año en curso
  y vecinos (ucoin actualiza el end_year del slug de forma irregular — ej. Estonia
  se quedó en 2022/2023). Reintentar la 1ª URL al final cubre fallos de timing.
- En la página, parsear la tabla `id="mintage"`: filas `<tr><td><strong>{año}</strong>...`.
  Columnas: `Año [Marca] Unc BU Proof` (la columna Marca solo si hay `<th>Marca</th>`).
- Valores crudos de ucoin: número = tirada confirmada · `+` = acuñada, sin publicar ·
  `-` = no acuñada · fila ausente = año no publicado aún.

### Aliases y slugs
El script mapea nombres español→slug. Slugs no obvios: San Marino = `san_marino`,
Vaticano = `vatican_city`. Las 25 entidades = 21 estados UE de la eurozona
(Bulgaria desde 2026-01-01) + Andorra, Mónaco, San Marino, Vaticano.

---

## Salida Excel

Fichero: `~/Downloads/ucoin_{YEAR}[_{COUNTRY}].xlsx`
Columnas: País | Tipo (Unc/BU/Proof) | 1ct | 2ct | 5ct | 10ct | 20ct | 50ct | 1€ | 2€

Colores por celda:
- Verde → número confirmado
- Amarillo → `+` (acuñada, tirada sin publicar)
- Gris → `pendiente de actualización` (año no en ucoin aún)
- Blanco → `—` (no acuñada)

Tras ejecutar, imprimir solo la ruta del fichero. No tocar Supabase ni sugerir nada
más salvo que el usuario lo pida.

---

## Troubleshooting

| Problema | Solución |
|---|---|
| `🚫 ucoin ha BLOQUEADO esta IP` | Anti-scraping disparado por exceso de peticiones. Dejar enfriar la IP unas horas (mejor al día siguiente) y ejecutar la skill UNA vez, sin peticiones extra. NO depurar a ráfagas. |
| `no working URL found` esporádico | Timing de Safari. El script ya reintenta la 1ª URL; reejecutar ese país. |
| Todas las celdas en gris pero ucoin sí tiene datos | ucoin cambió el HTML. Revisar los patrones `id="mintage"`, `<strong>(\d{4})</strong>`, `<th>Marca</th>`. |
| `ModuleNotFoundError: openpyxl` | `pip3 install openpyxl` |
| macOS deniega AppleScript | Ajustes → Privacidad → Automatización → permitir a Terminal. |
| Bulgaria "no se pudo configurar" para años < 2026 | Correcto: entró al euro el 2026-01-01. |
| URLs fallan a partir de enero | Actualizar `CURRENT_YEAR` en el script al año en curso. |
