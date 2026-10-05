# coinsDDLP v2.0

> Al cerrar cada sesión de implementación: actualiza **"Estado actual"** aquí y añade una fila a `docs/historial.md` (historial completo de sesiones).

Gestión de una colección personal de monedas: consulta, búsqueda y filtros públicos; con login, alta/edición/borrado. Monorepo:

| Carpeta | Contenido |
|---------|-----------|
| `coins-ddlp-front/` | Angular 22 (Node ≥ 24.15) + PrimeNG 22, SCSS. Deploy en Vercel en cada push a `main` (`vercel.json` con rewrite SPA) |
| `supabase/` | PostgreSQL (migraciones, aplicar con `supabase db push`), Auth email/password, Edge Functions Deno |
| `scripts/` | Utilidades de datos en Python (`scrape_ucoin.py`) |
| `swagger.yaml` | Spec de la API de Numista |

## Reglas de código (obligatorias)

**Angular 22**
- Standalone, sin `NgModule`; `provideX()` en `app.config.ts`. Rutas lazy con `loadComponent`. Guards funcionales con `inject()`
- `inject()`, nunca inyección por constructor. `input()` / `output()` signals
- Estado de UI con `signal()` / `computed()` / `effect()`, nunca `BehaviorSubject`. RxJS solo para interop (`toSignal`); el SDK de Supabase es de Promesas
- `@if` / `@for` / `@switch`, nunca `*ngIf` / `*ngFor`
- OnPush por defecto: no declarar `changeDetection`, nunca `ChangeDetectionStrategy.Eager`. Todo lo que pinta la plantilla es un signal
- Sin `@angular/animations`: animaciones con `animate.enter` / `animate.leave` y clases CSS

**Arquitectura (SOLID)**
- Dependencias entre capas: `layout → core, shared` · `features → core, shared` · `core → shared` · `shared →` nada. Una feature no importa de otra: se comunican navegando (p. ej. conmemorativas abre `/euros/:country/moneda/:id?from=conmemorativas`)
- Un componente nunca llama a Supabase: siempre vía su servicio de feature. Un servicio nunca conoce PrimeNG ni muestra toasts/modales (eso es del componente)
- Interfaces/contratos en `shared/interfaces/` (`IEurosRepository`, `IAuthService`…); servicios las implementan, componentes las consumen. Abstracciones vía interfaces/`InjectionToken`
- Helpers en `shared/helpers/`: funciones puras sin estado ni inyección
- Ningún texto hardcodeado en plantillas ni servicios: todo en `shared/constants/literals.ts` (`LITERALS.<sección>.<clave>`); los toasts en `TOAST_MESSAGES` (`toast-messages.const.ts`), que tira de `literals.ts`
- Componentes PrimeNG importados uno a uno en cada componente

**Errores** — todo componente con llamadas asíncronas inyecta `ErrorHandler` y llama a `this.errorHandler.handleError(e)` en el `error:` del `subscribe` o en el `catch`, antes de actualizar su estado local. Los servicios nunca llaman a `ErrorHandler`. `GlobalErrorHandler` (`core/services/global-error-handler.service.ts`) elige el mensaje del toast: status 0 → "Comprueba tu conexión…" › `error.error.message` (REST de Supabase) › `error.error.error` (nuestras Edge Functions, `{ error }`) › `error.message` (`Error` / `PostgrestError`) › "Ha ocurrido un error inesperado". **No añadir `provideBrowserGlobalErrorListeners()`**: mandaría al toast los errores sin capturar de scripts ajenos (extensiones, la cartera de Brave en móvil con `window.ethereum`). Angular ya pasa al `ErrorHandler` los errores de plantillas, eventos y detección de cambios.

**Toasts** — un único `p-toast` en `app.html` (modo apilado de PrimeNG 22, `preventOpenDuplicates`, a todo el ancho en móvil con `TOAST_BREAKPOINTS`). Los componentes solo lanzan éxitos/info: `this.messageService.add(TOAST_MESSAGES.<sección>.<clave>)`, sin spread ni `life` (3 s por defecto; los errores, 5 s). Los mensajes con datos son funciones (`tiradaSuccess(n)`). Los errores van solo por `ErrorHandler`: nunca un toast de error propio ni un aviso inline duplicado; el aviso inline queda para validaciones y para login/recuperación.

**Carga**
- `app-skeleton` (`shared/components/skeleton`) es el **único** marcador de carga: nunca `p-skeleton` directo ni spinners. Inputs: `count`, `height`, `width`, `radius` sm/md/lg/full, `shape` rect/circle (círculo 1:1 al ancho dado), `layout` `stack` (columna propia) | `inline` (fluye en la fila de chips o grid del padre), `announce` (anuncia "Cargando…"; si una vista pinta varios, solo el principal anuncia y el resto lleva `[announce]="false"`)
- Cada vista tiene `isReady`: vuelve a `false` (skeleton) al cambiar lo que se ve (país, colección) o al reintentar; tras editar recarga sin skeleton
- Recarga tras editar: los servicios exponen una señal `revision` (se incrementa en create/update/remove) que las vistas leen en su `effect` de carga
- Cada carga guarda su `Subscription` y cancela la anterior (`this.loadSub?.unsubscribe()`) para que una respuesta antigua no pise la nueva
- Acciones (guardar, borrar): `app-button [loading]`

**Vacío y error**
- Fallo de carga: `<app-error-panel (retry)="…" />` (vistas dentro de `app-page-layout`; en las fichas `[compact]="true"`). Mensaje común con Reintentar y `role="alert"`; el motivo concreto lo da el toast. Si falla una recarga sin skeleton (tras editar) se mantienen los datos y no se muestra el panel
- Lista vacía: `app-empty-panel` alimentado por `getEmptyState(search, ownership)` (`shared/helpers/empty-state.helper.ts`): búsqueda → "Sin resultados para «X»" + Borrar búsqueda (`onSearch('')`) › Faltantes → "¡No te falta ninguna!" (`tone="success"`) › Obtenidas → "Aún no tienes ninguna" › "No hay nada que mostrar". Inputs del panel: `icon`, `title`, `message`, `tone` neutral/success/error, `compact`, `actionLabel`/`actionIcon` + output `action`

## Estilos y diseño

Tema oscuro **"medianoche + oro"** siempre activo. Prototipo: https://claude.ai/artifact/Vxbqtx1mB61suyw27FfnwP

- **Tokens** (`src/styles/`, en `includePaths`: `@use 'mixins' as *;`):
  - `_variables.scss`: superficies `--bg` → `--surface-1` (tarjetas, tablas) → `-2` (hover, inputs) → `-3` (drawers, diálogos) → `-4`; bordes `--border-subtle/--border/--border-strong`; texto `--text/-soft/-muted/-faint`; marca `--primary` azul (enlaces, foco, selección) y `--accent` oro (botón principal, activo, progreso); estados `--state-*-bg/text`; radios `--radius-sm/md/lg/xl/full` (6/10/16/20px); `--space-1…9` (escala de 4px); sombras, `--ring`
  - `_typography.scss`: Inter (interfaz, cifras tabulares) y Montserrat (h1–h3, títulos de diálogo); `--font-2xs` (10px) … `--font-2xl` (32px), `--font-body` (14px, tablas y controles), `--font-title` (`clamp()`), base 16px; pesos, interlineado, `--letter-spacing-*`, `--icon-md`
  - `_breakpoints.scss`: mixins `mobile` (< 768), `tablet` (768–1279), `tablet-up`, `desktop` (≥ 1280)
  - `_mixins.scss`: `focus-ring`, `card`, `card-interactive`, `page-container`, `truncate`, `overline`, `scroll-row`, `stack-table-on-mobile` · `_forms.scss`: controles propios · `_detail.scss`: mixin `detail-content` de las fichas
- **Conservación → severidad de badge:** FDC/SC `success` · EBC/MBC `info` · BC/RC `warn` · MC `danger` · ND (no disponible; valor por defecto cuando no hay fila en `euro_ownership`) sin color. Unidades y "no circulante" → `accent`; variantes LA/LR → `secondary`
- **Layout:** desktop sidebar 248px plegable (preferencia en `localStorage`); tablet sidebar raíl 72px (iconos con tooltip); móvil `topbar` + `bottom-nav` de 5 pestañas ("Más" abre `more-sheet`), tablas como tarjetas, diálogos a todo el ancho. Contenido `max-width: 1280px` (`page-container`)

**Reglas:**
- Nada de color, tamaño de fuente, peso ni letter-spacing hardcodeado: siempre `var(--…)`. Los únicos hex viven en `_variables.scss` y en `core/theme/app-preset.ts`
- Estilos de cada componente en su `.component.scss`. `styles.scss` solo para reset, utilidades globales (`.sr-only`, `.table-stack`) y theming de PrimeNG. Sin `style="…"` en plantillas
- Tablas: `<p-table class="table-stack">` (en PrimeNG 22 `styleClass` no se aplica a `p-table`) y en cada `<td>` `data-label="…"` o `data-cell="primary|secondary|hide-mobile"` para las tarjetas de móvil
- Diálogos: siempre `app-dialog` (`shared/components/dialog`), nunca `p-dialog` directo. Inputs `header`, `size` sm/md/lg (400/440/460px, a todo el ancho en móvil), `closable` (false también quita Escape), `dismissable`; slots cuerpo, `[dialog-header-start|end]` y `<ng-container dialog-footer>` para las acciones (Cancelar en `secondary`). Cada diálogo expone `visible = model()` y el padre usa `[(visible)]`, sin output `closed`. El formulario se rellena **al abrir** (`effect` sobre `visible()` + `untracked`) y el estado transitorio se limpia en `(hidden)` (fin de la animación). Errores de guardado: solo el toast de `ErrorHandler` (aviso dentro del diálogo solo en login/recuperación). Los diálogos de edición se montan con `@if` del permiso
- Accesibilidad: foco visible (`focus-ring`), botones solo-icono con `tooltip` (hace de `aria-label`), labels asociadas, filas clicables con `tabindex="0"` y Enter

## Estructura del front (`coins-ddlp-front/src/app/`)

- `core/` — singletons. `guards/` (`adminGuard` para `/admin` y `/herramientas`; `authGuard` existe pero ninguna ruta lo usa); `services/`: `supabase` (CRUD genérico, cliente por el token `SUPABASE_CLIENT` de `app.config.ts`), `auth`, `numista` (Edge Function `numista-proxy`, expone la cuota restante), `owner` (colección activa), `global-error-handler`; `theme/app-preset.ts` (preset Aura oscuro)
- `layout/` — shell: `sidebar`, `user-menu`, `topbar`, `bottom-nav`, `more-sheet`, `login-dialog`, `recovery-password-dialog`, `layout-state.service.ts` (viewport, sidebar plegado, panel "Más", diálogo de login), `navigation.config.ts` (`NAV_ITEMS`)
- `features/` — `euros` (euros-countries, euros-country, coin-detail-drawer, coin-uds-dialog, `euros-permissions.ts`), `conmemorativas`, `pesetas` (pesetas-browser, peseta-detail-drawer, peseta-edit-dialog, `denomination-order.ts`), `estadisticas` (vacía), `ubicacion` (ubicacion-map, ubicacion-edit-dialog), `admin` (admin-users, admin-user-dialog), `tools` (tools-add-euro, tools-add-year)
- `shared/` — `components/` (page-layout, detail-drawer, skeleton, progress-stat, badge, button, buttons-header, dialog, confirm-dialog, country-flag, empty-panel, error-panel, filter-pills, search-input, select, text-input, textarea, toggle); `constants/` (literals, toast-messages, dialog, conservation-states, collections, `*-filter.config`, `app-version` = versión de `package.json`, mostrada al pie del sidebar y de "Más"); `interfaces/`; `helpers/` (normalize-strings, country, search-state, badge, unique-id, empty-state); `pipes/` (euro-value); `services/` (excel-export con ExcelJS, page-header)
- `app.config.ts`: Supabase, Router, HttpClient con `fetch`, PrimeNG (preset + licencia), `LOCALE_ID 'es'`. Assets en `coins-ddlp-front/public/` (favicon, `assets/flags/`)

**Patrones:**
- **Página de colección:** `app-page-layout` (título, bandera, subtítulo, buscador, slots `[page-aside]` con `progress-stat`, `[page-actions]`, `[page-filters]`); alimenta `PageHeaderService` (barra superior de móvil). Los buscadores persisten en `sessionStorage` (`search-state` helper)
- **Ficha de detalle:** ruta hija `moneda/:id` que pinta `app-detail-drawer` sobre la lista. Usa fondo y bloqueo de scroll propios (nunca la máscara modal de `p-drawer`: queda huérfana y bloquea la app al destruirse) y emite `closed` una vez al terminar de cerrarse. Su input `loading` muestra el skeleton de ficha: euros hasta tener moneda **y** Numista, pesetas hasta tener la peseta
- **Banderas** (circulares con anillo): `public/assets/flags/{iso3}.png` (ISO 3166-1 alfa-3 en minúsculas; `eue` = Europa). `LITERALS.countries` mapea ISO3 → nombre tal como lo guarda la BD; `country-flag` recibe el nombre y `getCountryIso3`/`getFlagPath` (`shared/helpers/country.helper.ts`) sacan el código. Un país nuevo necesita su entrada en `LITERALS.countries` y su `.png`; sin entrada no se pinta bandera. Tamaño sobrescribible con `--flag-size`
- **Fotos:** euros vía Numista (`numista-proxy`); pesetas en `peseta_type.image*`. Numista devuelve 403 a navegadores headless: en capturas automáticas no salen

## Rutas

| Ruta | Vista |
|------|-------|
| `/` y `/**` | redirigen a `/euros` |
| `/euros` | países (tarjetas con progreso) |
| `/euros/:country?year=2005` | país con chips de año ("Todos" sin `year`) |
| `/euros/:country/moneda/:id` | ídem + drawer (`?from=conmemorativas` vuelve allí) |
| `/conmemorativas` | lista por año con chips de salto |
| `/pesetas?valor=5 pesetas` · `/pesetas/moneda/:id` | chips de denominación · + drawer |
| `/ubicacion` | álbumes en tarjetas; pública, edición solo admin |
| `/estadisticas` | admin, pendiente |
| `/admin/usuarios` · `/herramientas/añadir-euro\|año` | `adminGuard` |

- Redirecciones de URLs antiguas: `/euros/:country/all`, `/euros/:country/:year[/:id]`, `/pesetas/all`, `/pesetas/:faceValue[/:id]`
- No hay ruta `/login`: `login-dialog` se abre desde sidebar, topbar o "Más" con `LayoutStateService.openLogin()` / `openLogout()`
- CRUD con diálogos dentro de las vistas públicas; los botones de edición solo se muestran con permisos (ver Colecciones)

## Datos (Supabase)

Proyecto `https://uvkvagoipxgagyupxoqd.supabase.co` (anon key en `environment*.ts`). **Todas las columnas en camelCase.** Las interfaces TS están en `shared/interfaces/`.

- `euro` — catálogo (5.441 filas en la migración inicial, más las LR añadidas después): `id` (uuid texto), `year`, `country`, `mint?` (ceca), `faceValue` ("1 Céntimo", "2 Euros", "2 Euros C"…), `description`, `commemorative`, `circulation` (false = no circulante/coleccionista), `idNum` (ID de Numista; en 2026-04 faltaba en 370 conmemorativas), `variant?` (`LA`/`LR` solo en 2 € y 2 € C; ya migrado en todos los países salvo Bulgaria, Estonia y Malta, que no tienen variantes; orden `faceValue → description → variant NULLS FIRST`)
- `owner` (`id` = `auth.uid()`, `name`, `slug` `dario`/`manolo`) y `euro_ownership` (`euroId`, `ownerId`, `uds`, `conservation`, `observations`; único por moneda y dueño): posesión por colección
- `peseta_type` — 187 tipos de pesetas circulantes 1868–2001 scrapeados de Numista (`cu=142`): datos técnicos, imágenes, descripciones y `mintingYears` (JSONB: `label`, `designYear`, `mintYear`, `mintage`). `peseta` — 525 ejemplares (`pesetaTypeId`, uds, conservación, observaciones)
- `country_location` — álbum por país (`country`, `album`, `yearFrom`, `yearTo`, `isClosed`)
- `numista_usage` — contadores de la API de Numista (los escribe `numista-proxy` con service_role)
- **RLS** (además hacen falta `GRANT` para la Data API, ver `20260528000001_grant_data_api_access.sql`): `euro`, `peseta`, `peseta_type`, `country_location` → lectura `anon` + `authenticated`, escritura `authenticated`. `owner` → solo lectura. `euro_ownership` → lectura pública, escritura **solo de las filas propias** (`auth.uid() = ownerId`). `numista_usage` → lectura `authenticated`
- **Edge Functions** (`supabase/functions/`): `numista-proxy` (oculta `NUMISTA_API_KEY`, devuelve `X-Numista-Remaining`) y `admin-users` (gestión de usuarios). Secretos (`SUPABASE_SERVICE_ROLE_KEY`, `NUMISTA_API_KEY`) solo en el panel de Supabase

**Colecciones (Darío / Manolo / ambas):** `OwnerService` guarda la activa en `sessionStorage`; los servicios hacen LEFT JOIN a `euro_ownership` y en modo *ambas* añaden campos `*Alt` (columnas dobles en tablas y Excel). Editar unidades (`injectCanEditCoins`, `euros-permissions.ts`): el admin siempre; un usuario solo viendo **su propia** colección, nunca en *ambas*. Borrar monedas, solo admin. En `coin-uds-dialog` el selector de colección solo aparece en *ambas* + admin. Los filtros *obtenidas*/*faltantes* en *ambas* exigen la condición a los dos dueños. `update()` reparte los cambios entre `euro` y `euro_ownership`; Herramientas solo crea catálogo (`NewEuroCoin`).

## PrimeNG 22

- Tema: `definePreset` de `@primeuix/themes` (`@primeng/themes` está obsoleto), preset Aura en `core/theme/app-preset.ts`. Oscuro siempre: `darkModeSelector: '.app-dark'` + `class="app-dark"` en `<html>` (Aura v3 usa `light-dark()`)
- Plantillas con variable (`<ng-template #header>`, `#body`, `#groupheader`); `pTemplate` ya no existe
- `styleClass` no se aplica a `p-table` (usar `class`); en `p-drawer` sí
- Con `rowGroupMode="subheader"` PrimeNG ordena `groupRowsBy` como texto: usar claves que ordenen bien (ceros a la izquierda)
- **Licencia** PrimeUI Community en `environment.primeuiLicense` (ambos `environment*.ts`) → `providePrimeNG({ license })`. **Caduca el 2027-10-02**: renovar en https://primeui.dev/licenses/community (si caduca, la app muestra un aviso)

## Estado actual

> **Última actualización:** 2026-10-05

- Producción: **https://coinsddlp.vercel.app** (Vercel Hobby, deploy en cada push a `main`)
- **Versión en producción: v3.0.1** (v3.0.0 = Angular 22 + PrimeNG 22 + rediseño oscuro y responsive; v3.0.1 = sin toasts de errores de scripts ajenos). Si falla en producción: Vercel → Deployments → Instant Rollback
- **Releases con release-please:** en cada push a `main`, `.github/workflows/release-please.yml` abre o actualiza el PR `chore(release): vX.Y.Z` con `CHANGELOG.md` y la versión en `version.txt`, `coins-ddlp-front/package.json` y `package-lock.json`. Al fusionarlo crea la etiqueta `vX.Y.Z` y la release de GitHub. Versión según los commits: `fix`/`refactor`/`perf` → parche, `feat` → menor, `!`/BREAKING CHANGE → mayor; `docs`/`chore` no sacan versión. Configuración en `release-please-config.json` (repo entero, etiquetas sin componente, secciones en castellano) y `.release-please-manifest.json` (versión actual, la mantiene el robot). Nunca subir la versión ni etiquetar a mano. Requiere en GitHub *Settings → Actions → General → Allow GitHub Actions to create and approve pull requests* y *Settings → General → Automatically delete head branches* (ambos activados). Comprobado: el primer `fix` abrió el PR #1 y al fusionarlo salió v3.0.1

**Pendiente:**
0. **PR de release v3.1.0** (incluye la versión visible, `feat(layout)` 63f8607): el 2026-10-05 la ejecución de release-please se quedó en cola por una incidencia de GitHub Actions. Comprobar que se abrió el PR y fusionarlo; si la ejecución se canceló (24 h en cola), Actions → Re-run jobs o se recupera con el siguiente push a `main`
1. Sección **Estadísticas**: `estadisticas-dashboard` existe vacío (literales en `LITERALS.estadisticas`). Hacerla con `page-layout`, `progress-stat`, tokens y `resource`/`httpResource`
2. Probar en navegador lo del 2026-10-04 que solo se verificó compilando: banderas ISO3 (tarjetas de países, cabecera, fichas, conmemorativas, ubicación, topbar en móvil), diálogos (reabrir tras cancelar, cerrar sesión, Escape en recuperación, pie fijo en móvil), toasts (ancho en móvil, sin duplicados offline) y estados vacíos (búsqueda, Faltantes)
3. Permisos: `coin-uds-dialog` deja a un usuario no admin editar campos de catálogo (descripción, circulante, ID Numista) que se guardan en `euro`
4. Permisos: la RLS de `euro_ownership` solo deja escribir filas propias, pero `injectCanEditCoins` deja al admin editar la colección de Manolo; probablemente Supabase rechace ese guardado. Probarlo y, si falla, migración con política de escritura para el admin
5. `GlobalErrorHandler` muestra los mensajes de Supabase en inglés ("Invalid login credentials"…): traducir los más comunes
6. Datos: 370 conmemorativas sin `idNum` (sin foto ni datos de Numista en la ficha)
