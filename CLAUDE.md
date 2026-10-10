# coinsDDLP v2.0

> Al cerrar cada sesión de implementación: actualiza **"Estado actual"** aquí y añade una fila a `docs/historial.md` (historial completo de sesiones).

Gestión de una colección personal de monedas: consulta, búsqueda y filtros públicos; con login, alta/edición/borrado. Monorepo:

| Carpeta | Contenido |
|---------|-----------|
| `coins-ddlp-front/` | Angular 22 (Node ≥ 24.15) + PrimeNG 22, SCSS, Transloco (ES/EN). Deploy en Vercel en cada push a `main` (`vercel.json` con rewrite SPA) |
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
- Ningún texto hardcodeado en plantillas ni servicios: todo en `public/i18n/es.json` **y** `en.json` (mismas claves; `scripts/check-i18n.mjs` corre en `prebuild` y rompe la build si falta o sobra una). Ver **Idiomas**
- Componentes PrimeNG importados uno a uno en cada componente

**Errores** — todo componente con llamadas asíncronas inyecta `ErrorHandler` y llama a `this.errorHandler.handleError(e)` en el `error:` del `subscribe` o en el `catch`, antes de actualizar su estado local. Los servicios nunca llaman a `ErrorHandler`. `GlobalErrorHandler` (`core/services/global-error-handler.service.ts`) elige el mensaje del toast: status 0 → "Comprueba tu conexión…" › `error.error.message` (REST de Supabase) › `error.error.error` (nuestras Edge Functions, `{ error }`) › `error.message` (`Error` / `PostgrestError`) › "Ha ocurrido un error inesperado". **No añadir `provideBrowserGlobalErrorListeners()`**: mandaría al toast los errores sin capturar de scripts ajenos (extensiones, la cartera de Brave en móvil con `window.ethereum`). Angular ya pasa al `ErrorHandler` los errores de plantillas, eventos y detección de cambios.

**Toasts** — un único `p-toast` en `app.html` (modo apilado de PrimeNG 22, `preventOpenDuplicates`, a todo el ancho en móvil con `TOAST_BREAKPOINTS`). Los componentes solo lanzan éxitos/info: `this.messageService.add(this.i18n.toast(TOAST_MESSAGES.<sección>.<clave>))` (`TOAST_MESSAGES` guarda claves; `I18nService.toast()` las traduce en el idioma activo), sin spread ni `life` (3 s por defecto; los errores, 5 s). Con datos, el prefijo va de segundo argumento (`toast(…tiradaSuccess, n)`). Los errores van solo por `ErrorHandler`: nunca un toast de error propio ni un aviso inline duplicado; el aviso inline queda para validaciones y para login/recuperación.

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

- `core/` — singletons. `guards/` (`adminGuard` para `/admin`; `permissionGuard(...permisos)` para secciones y Herramientas; ambos esperan a que cargue la sesión; `authGuard` existe pero ninguna ruta lo usa); `services/`: `supabase` (CRUD genérico, cliente por el token `SUPABASE_CLIENT` de `app.config.ts`), `auth` (`ready`), `permissions` (permisos efectivos, `injectCan(...)`, ver **Permisos**), `numista` (Edge Function `numista-proxy`, expone la cuota restante), `access-log` (registro de accesos, ver **Registro de accesos**), `owner` (colecciones de la tabla `owner`, la activa y la comparada), `global-error-handler`; `theme/app-preset.ts` (preset Aura oscuro)
- `layout/` — shell: `sidebar`, `user-menu`, `topbar`, `bottom-nav`, `more-sheet`, `login-dialog`, `recovery-password-dialog`, `layout-state.service.ts` (viewport, sidebar plegado, panel "Más", diálogo de login), `navigation.config.ts` (`NAV_ITEMS`)
- `features/` — `euros` (euros-countries, euros-country, coin-detail-drawer, coin-uds-dialog, `euros-permissions.ts`), `conmemorativas`, `pesetas` (pesetas-browser, peseta-detail-drawer, peseta-edit-dialog, `denomination-order.ts`), `estadisticas` (estadisticas-dashboard, year-chart, `estadisticas.service`), `ubicacion` (ubicacion-map, ubicacion-edit-dialog), `admin` (admin-users, admin-user-dialog, admin-access-log, access-visit-dialog), `tools` (tools-add-euro, tools-add-year)
- `shared/` — `components/` (page-layout, detail-drawer, skeleton, progress-stat, badge, button, buttons-header, dialog, confirm-dialog, country-flag, empty-panel, error-panel, filter-pills, search-input, select, stat-card, text-input, textarea, toggle); `constants/` (toast-messages, i18n (idiomas y clave de `localStorage`), countries (`COUNTRY_DB_NAMES`), dialog, conservation-states, collections, `*-filter.config`, `face-value-order`, `app-version` = versión de `package.json`, mostrada al pie del sidebar y de "Más"); `interfaces/`; `helpers/` (normalize-strings, country, search-state, badge, unique-id, empty-state, ownership = `isOwned`, euro-stats = agregados de Estadísticas); `pipes/` (euro-value, countryName, faceValue); `services/` (i18n, excel-export con ExcelJS (recibe las cabeceras traducidas), page-header)
- `app.config.ts`: Supabase, Router, HttpClient con `fetch`, PrimeNG (preset + licencia), Transloco (loader `core/i18n/transloco-loader.ts`, idioma inicial `core/i18n/initial-lang.ts`, diccionario precargado con `provideAppInitializer`), `LOCALE_ID 'es'` (solo por defecto: los números usan `lang()`). Assets en `coins-ddlp-front/public/` (favicon, `assets/flags/`)

**Patrones:**
- **Página de colección:** `app-page-layout` (título, bandera, subtítulo, buscador, slots `[page-aside]` con `progress-stat`, `[page-actions]`, `[page-filters]`); alimenta `PageHeaderService` (barra superior de móvil). Los buscadores persisten en `sessionStorage` (`search-state` helper)
- **Ficha de detalle:** ruta hija `moneda/:id` que pinta `app-detail-drawer` sobre la lista. Usa fondo y bloqueo de scroll propios (nunca la máscara modal de `p-drawer`: queda huérfana y bloquea la app al destruirse) y emite `closed` una vez al terminar de cerrarse. Su input `loading` muestra el skeleton de ficha: euros hasta tener moneda **y** Numista, pesetas hasta tener la peseta
- **Banderas** (circulares con anillo): `public/assets/flags/{iso3}.png` (ISO 3166-1 alfa-3 en minúsculas; `eue` = Europa). `COUNTRY_DB_NAMES` (`shared/constants/countries.const.ts`) mapea ISO3 → nombre tal como lo guarda la BD (castellano); `country-flag` recibe el nombre y `getCountryIso3`/`getFlagPath` (`shared/helpers/country.helper.ts`) sacan el código. Un país nuevo necesita su entrada en `COUNTRY_DB_NAMES`, su nombre visible en `countries.<ISO3>` de los dos JSON y su `.png`; sin entrada no se pinta bandera. Tamaño sobrescribible con `--flag-size`
- **Fotos:** euros vía Numista (`numista-proxy`); pesetas en `peseta_type.image*`. Numista devuelve 403 a navegadores headless: en capturas automáticas no salen

## Idiomas (ES/EN)

- **Transloco** (`@jsverse/transloco`) con `public/i18n/{es,en}.json`. Idioma inicial: el elegido (`localStorage` `lang`) › el del navegador (español → ES, otro → EN). Selector `app-language-toggle` al pie del sidebar (botón único en modo raíl) y en "Más". Cambia **en caliente**, sin recargar
- Tipos: `Translations` = forma de `es.json` (`shared/interfaces/translations.interface.ts`, `resolveJsonModule`), así que `literals().clave` se comprueba al compilar
- **Patrón:** `readonly literals = injectLiterals('euros')` (`shared/services/i18n.service.ts`) y en plantilla `literals().title`; nunca leer textos una sola vez en constantes. Las configs con textos (menú, filtros, roles, navegación de admin/herramientas) son funciones de `Translations[...]` o guardan claves (`NAV_ITEMS.labelKey`), y el componente las envuelve en `computed`. Helpers puros (`getEmptyState`, `getRoleBadge`) reciben la sección como parámetro
- Números: `| number:'1.0-0':lang()` y `formatNumber(v, lang(), …)` con `lang = inject(I18nService).lang`
- Datos: los nombres de país y valores faciales de la BD se traducen al pintar con las pipes `countryName` / `faceValue` (o `translateCountry` / `translateFaceValue` en TS); las búsquedas por país aceptan ambos nombres (`matchesCountry`). Descripciones, estados de conservación, cecas y URLs quedan en castellano
- **Numista** (ficha de euros): `numista-proxy` acepta `lang` (`es`/`en`/`fr`, por defecto `es`) y la ficha pide los textos (anverso, reverso, canto, comentarios) en el idioma activo; si se cambia de idioma con la ficha abierta, los vuelve a pedir (gasta una consulta de la cuota). Las pesetas guardan los textos de Numista en la BD en castellano: no se traducen
- `app.ts` sincroniza `<html lang>` y los textos internos de PrimeNG (sección `primeng`) con el idioma activo
- Tests: `TranslocoTestingModule.forRoot({ langs: { es } … })`

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
| `/estadisticas` | pública: KPIs, progreso por país, valor facial y año (euros, según la colección activa) |
| `/admin/usuarios` · `/admin/registro` | `adminGuard` (usuarios · registro de accesos) |
| `/herramientas/añadir-euro\|año` | `permissionGuard('tools.addEuro' / 'tools.addYear')`; `/herramientas` abre la primera pestaña permitida |

`/conmemorativas`, `/pesetas`, `/ubicacion` y `/estadisticas` llevan `permissionGuard('section.…')`.

- Redirecciones de URLs antiguas: `/euros/:country/all`, `/euros/:country/:year[/:id]`, `/pesetas/all`, `/pesetas/:faceValue[/:id]`
- No hay ruta `/login`: `login-dialog` se abre desde sidebar, topbar o "Más" con `LayoutStateService.openLogin()` / `openLogout()`
- CRUD con diálogos dentro de las vistas públicas; los botones de edición solo se muestran con permisos (ver Colecciones)

## Datos (Supabase)

Proyecto `https://uvkvagoipxgagyupxoqd.supabase.co` (anon key en `environment*.ts`). **Todas las columnas en camelCase.** Las interfaces TS están en `shared/interfaces/`.

- `euro` — catálogo (5.441 filas en la migración inicial, más las LR añadidas después): `id` (uuid texto), `year`, `country`, `mint?` (ceca), `faceValue` ("1 Céntimo", "2 Euros", "2 Euros C"…), `description`, `commemorative`, `circulation` (false = no circulante/coleccionista), `idNum` (ID de Numista; en 2026-04 faltaba en 370 conmemorativas), `variant?` (`LA`/`LR` solo en 2 € y 2 € C; ya migrado en todos los países salvo Bulgaria, Estonia y Malta, que no tienen variantes; orden `faceValue → description → variant NULLS FIRST`)
- `owner` (`id` = `auth.uid()` con FK a `auth.users` en cascada, `name` = nombre del usuario, `isDefault` único: la que ven los visitantes; Darío) y `euro_ownership` (`euroId`, `ownerId`, `uds`, `conservation`, `observations`; único por moneda y dueño): posesión por colección
- `peseta_type` — 187 tipos de pesetas circulantes 1868–2001 scrapeados de Numista (`cu=142`): datos técnicos, imágenes, descripciones y `mintingYears` (JSONB: `label`, `designYear`, `mintYear`, `mintage`). `peseta` — 525 ejemplares (`pesetaTypeId`, uds, conservación, observaciones)
- `country_location` — álbum por país (`country`, `album`, `yearFrom`, `yearTo`, `isClosed`)
- `numista_usage` — contadores de la API de Numista (los escribe `numista-proxy` con service_role)
- `access_visit` / `access_event` — registro de accesos (ver **Registro de accesos**)
- `user_permission` (`userId`, `permission`) y `guest_permission` (`permission`): permisos por usuario y del perfil Invitado (ver **Permisos**). Solo los escribe `admin-users` (service_role)
- **RLS** (además hacen falta `GRANT` para la Data API, ver `20260528000001_grant_data_api_access.sql`), desde `20261009000000_user_permissions.sql` con las funciones `is_admin()` y `has_permission(p)` (admin › Invitado › usuario): lectura pública en `euro`, `peseta`, `peseta_type`, `country_location`, `owner`, `euro_ownership`. Escritura: `euro` INSERT `tools.addEuro`/`tools.addYear`, UPDATE `euros.catalog.edit`, DELETE `euros.delete`; `euro_ownership` filas propias con `euros.units.editOwn` o cualquiera con `euros.units.editAny`; `country_location` `location.create/update/delete`; `peseta`, `peseta_type` solo admin. `user_permission` → cada uno lee las suyas; `guest_permission` → lectura pública. `numista_usage` → lectura `authenticated`; `access_visit`/`access_event` → lectura y borrado solo admin (escribe `access-log`)
- **Edge Functions** (`supabase/functions/`): `numista-proxy` (pública, `verify_jwt = false` en `config.toml`: el front la llama sin token; oculta `NUMISTA_API_KEY`, devuelve `X-Numista-Remaining`, acepta `lang`) y `admin-users` (solo admin: usuarios con sus permisos, `GET/PUT /guest` para el Invitado, `POST /:uid/recovery` envía el email de recuperación; valida las claves contra su lista `VALID_PERMISSIONS`/`GUEST_PERMISSIONS`). y `access-log` (pública, `verify_jwt = false`: `POST /visit`, `/event`, `/ping`; ver **Registro de accesos**). Secretos (`SUPABASE_SERVICE_ROLE_KEY`, `NUMISTA_API_KEY`) solo en el panel de Supabase

**Colecciones (una por usuario, se comparan 2 a la vez):** el admin da o quita la colección a cada usuario en `/admin/usuarios` (interruptores "Tiene colección propia" y "Colección por defecto"; quitarla borra sus monedas, con confirmación; la por defecto no se puede quitar ni borrar su usuario). `OwnerService` carga `owner` y guarda en `sessionStorage` la selección `{ primary, compare }`: `primaryId` (elegida › propia › por defecto), `compareId`, `isComparing`, `primaryName`/`compareName`; las vistas recargan con `selectionKey()` (`null` mientras cargan colecciones y permisos) y los servicios esperan a `ensureLoaded()`. Selector `app-collection-picker` (Colección + Comparar con). Los servicios filtran `euro_ownership` por las dos colecciones y al comparar rellenan los `*Alt` con la segunda (`pickOwnership`, columnas dobles en tablas y Excel con los nombres). Editar unidades (`injectCanEditUnits`, `euros-permissions.ts`): con `euros.units.editAny` siempre; con `euros.units.editOwn` solo viendo **su propia** colección (`OwnerService.ownId`) sin comparar. `coin-uds-dialog` muestra unidades/conservación/observaciones según eso y descripción/circulante/ID Numista solo con `euros.catalog.edit`, y solo envía lo permitido; su selector de colección aparece al comparar + `editAny`. Sin `collection.switch` se oculta el selector y la colección queda fija en la propia (o la por defecto). Al comparar, una moneda cuenta como obtenida si la tiene **alguna** de las dos (`isOwned`): progreso, tarjetas, Estadísticas y filtros (*Obtenidas* = alguna, *Faltantes* = ninguna). El progreso conjunto lleva debajo el desglose por colección (`app-progress-stat [breakdown]`, `countOwned`/`ownedBreakdown` en `ownership.helper`, `OwnerService.comparedNames`); el gráfico por año pinta una barra por colección (oro la principal, azul la comparada) y una marca con el conjunto. `update()` reparte los cambios entre `euro` y `euro_ownership`; Herramientas solo crea catálogo (`NewEuroCoin`).

## PrimeNG 22

- Tema: `definePreset` de `@primeuix/themes` (`@primeng/themes` está obsoleto), preset Aura en `core/theme/app-preset.ts`. Oscuro siempre: `darkModeSelector: '.app-dark'` + `class="app-dark"` en `<html>` (Aura v3 usa `light-dark()`)
- Plantillas con variable (`<ng-template #header>`, `#body`, `#groupheader`); `pTemplate` ya no existe
- `styleClass` no se aplica a `p-table` (usar `class`); en `p-drawer` sí
- Con `rowGroupMode="subheader"` PrimeNG ordena `groupRowsBy` como texto: usar claves que ordenen bien (ceros a la izquierda)
- **Licencia** PrimeUI Community en `environment.primeuiLicense` (ambos `environment*.ts`) → `providePrimeNG({ license })`. **Caduca el 2027-10-02**: renovar en https://primeui.dev/licenses/community (si caduca, la app muestra un aviso)

## Permisos

El admin (`app_metadata.role = 'admin'`) tiene todos. El resto: perfil **Invitado** (visitantes sin sesión; los usuarios también lo heredan) ∪ los suyos. Se editan en `/admin/usuarios` (interruptores en el diálogo de usuario; botón "Permisos de invitado"). Claves en `shared/constants/permissions.const.ts` (`PERMISSIONS`, `PERMISSION_GROUPS`, `GUEST_PERMISSIONS`), que deben coincidir con `admin-users` y la RLS:

| Clave | Qué permite | Lo hace cumplir |
|-------|-------------|-----------------|
| `euros.units.editOwn` / `editAny` | Editar unidades de su colección / de cualquiera | UI + RLS |
| `euros.catalog.edit` · `euros.delete` | Editar descripción, circulante, ID Numista · borrar monedas | UI + RLS |
| `tools.addEuro` · `tools.addYear` | Herramientas | guard + RLS |
| `location.create/update/delete` | Álbumes de Ubicación | UI + RLS |
| `location.viewInLists` · `export.excel` · `collection.switch` · `numista.quotaView` · `section.*` | Consulta (las admite el Invitado) | Solo UI: los datos siguen siendo públicos |

- Front: `PermissionsService` (`granted`, `can`, `ready`, `loaded`); en componentes `readonly canX = injectCan('…')`. Navegación con `NavItem.permissions` + `isNavItemVisible`. Los permisos propios se recargan al cambiar la sesión (al refrescar el token, ~1 h, o al recargar la página); la BD los aplica al momento
- Editar pesetas y gestionar usuarios no son permisos: solo admin
- Contraseñas: cada usuario cambia la suya ("Cambiar contraseña" en el menú de usuario y en "Más", `recovery-password-dialog` con `mode="change"`); el admin envía el email de recuperación desde el diálogo de usuario

## Registro de accesos

Solo el admin, en `/admin/registro`. Una **visita** es una pestaña abierta (`visitId` en `sessionStorage`: recargar no crea otra).

- **Captura** (`core/services/access-log.service.ts`, arrancado en `app.ts`): al abrir, `POST /visit` (pantalla, idiomas, referrer, ruta, `APP_VERSION`, si es táctil); cada `NavigationEnd` → evento `page`; `AuthService.login()` → `login` o `login_failed` (con el email), `logout()` → `logout` (antes de cerrar la sesión, para que lleve el token); al ocultar la pestaña `sendBeacon('/ping')` (duración). Dispara y olvida: nunca pasa por `ErrorHandler`. Solo con `environment.accessLog` (true en prod, false en local)
- **Edge Function `access-log`**: IP de `x-forwarded-for`, país/región/ciudad con ipapi.co (timeout 1,5 s), parser propio de user-agent (`user-agent.ts`: navegador, versión, sistema, desktop/tablet/mobile/bot; iPad con UA de Mac por `touch`). El usuario sale del token (`userName` = nombre de su colección › nombre › email). Rechaza visitas de más de 24 h (410: el front crea otra) y más de 500 eventos por visita
- **BD** (`20261011000000_access_log.sql`): `access_visit`, `access_event`, vista `access_visit_summary` (+ `pageCount`, `durationSeconds`), funciones `access_visit_filtered(p_from, p_user, p_exclude, p_search)` y `access_log_stats(…)` (`security invoker`: la RLS deja solo al admin). **pg_cron** `access-log-retention` borra cada noche lo de más de 90 días. La IP es dato personal (RGPD): mencionarlo si algún día hay página de privacidad
- **Vista**: cifras (visitas, visitantes únicos por IP, usuarios, inicios de sesión y fallidos), filtros (periodo, usuario/anónimos, búsqueda con debounce, "Ocultar mis visitas" activado por defecto), tabla paginada en el servidor (50, `p-paginator`), detalle con línea de tiempo (`access-visit-dialog`), Excel y "Vaciar registro"

## Estado actual

> **Última actualización:** 2026-10-10

- Producción: **https://coinsddlp.vercel.app** (Vercel Hobby, deploy en cada push a `main`)
- **Versión en producción: v3.4.0** (v3.0.0 = Angular 22 + PrimeNG 22 + rediseño oscuro y responsive; v3.0.1 = sin toasts de errores de scripts ajenos; v3.1.0 = versión visible + Estadísticas; v3.2.0 = idiomas ES/EN; v3.3.0 = permisos de usuario, PR #4; v3.4.0 = colección propia por usuario, PR #5). Si falla en producción: Vercel → Deployments → Instant Rollback
- **Releases con release-please:** en cada push a `main`, `.github/workflows/release-please.yml` abre o actualiza el PR `chore(release): vX.Y.Z` con `CHANGELOG.md` y la versión en `version.txt`, `coins-ddlp-front/package.json` y `package-lock.json`, **lo fusiona solo** (`gh pr merge` con el `GITHUB_TOKEN`) y en la misma ejecución vuelve a llamar a release-please para crear la etiqueta `vX.Y.Z` y la release de GitHub (un merge con el `GITHUB_TOKEN` no lanza otro workflow). Desde 2026-10-09: cada `feat`/`fix` sale como versión al momento; tras cada release hay que hacer `git pull` en local. Si el merge falla, el PR queda abierto y se fusiona a mano con `gh pr merge <n> --merge`. Versión según los commits: `fix`/`refactor`/`perf` → parche, `feat` → menor, `!`/BREAKING CHANGE → mayor; `docs`/`chore` no sacan versión. Configuración en `release-please-config.json` (repo entero, etiquetas sin componente, secciones en castellano) y `.release-please-manifest.json` (versión actual, la mantiene el robot). Nunca subir la versión ni etiquetar a mano. Requiere en GitHub *Settings → Actions → General → Allow GitHub Actions to create and approve pull requests* y *Settings → General → Automatically delete head branches* (ambos activados). Comprobado: el primer `fix` abrió el PR #1 y al fusionarlo salió v3.0.1. Si una ejecución falla, la siguiente agrupa en un solo PR todos los commits pendientes (así salió v3.1.0, PR #2). `gh` instalado y autenticado (2026-10-09): los PR de release se pueden fusionar con `gh pr merge <n> --merge`. **Merge automático comprobado el 2026-10-10**: al fusionar el PR #5, el workflow abrió y fusionó solo el PR #6 y creó `v3.4.0` en ~20 s. Los PR de funcionalidad se fusionan a mano (el modo auto de Claude Code no deja a Claude fusionar en `main`)

**Pendiente:**
0. **Idiomas ES/EN** (en producción desde v3.2.0; Numista en inglés ya comprobado): probar en un navegador real el cambio en caliente (menú, títulos, filtros, tablas, toasts, diálogos, barra de móvil), que se recuerde al recargar y el Excel en inglés
1. **Estadísticas** (en producción desde v3.1.0): revisar en un navegador real (tooltip del gráfico por año, móvil, cambio de colección). Ampliaciones posibles: conservación, repetidas para intercambio, pesetas
2. Probar en navegador lo del 2026-10-04 que solo se verificó compilando: banderas ISO3 (tarjetas de países, cabecera, fichas, conmemorativas, ubicación, topbar en móvil), diálogos (reabrir tras cancelar, cerrar sesión, Escape en recuperación, pie fijo en móvil), toasts (ancho en móvil, sin duplicados offline) y estados vacíos (búsqueda, Faltantes)
3. **Permisos** (en producción desde v3.3.0, probado el 2026-10-09 con usuarios temporales: 24/24 pruebas de RLS y `admin-users` por REST y 21/21 de interfaz con Playwright en producción, incluido el admin escribiendo en la colección de Manolo y el cambio de contraseña). Falta probar el **email de recuperación** desde /admin con un usuario con email real (el SMTP por defecto de Supabase solo envía a miembros del equipo del proyecto). La cuenta de Manolo tiene guardados también los 7 permisos de consulta (sin efecto: ya los hereda del Invitado)
4. **Colección propia por usuario** (en producción desde v3.4.0, probada en navegador por Darío): falta probar con un usuario temporal dar/quitar colección, `editOwn` en la propia y cambiar la por defecto
5. `GlobalErrorHandler` muestra los mensajes de Supabase en inglés (también en modo ES) ("Invalid login credentials"…): traducir los más comunes
6. Datos: 370 conmemorativas sin `idNum` (sin foto ni datos de Numista en la ficha)
7. **Registro de accesos** (rama `feat/access-log`): antes de fusionar, aplicar la migración `20261011000000_access_log.sql` (`npx supabase@latest db push`) y desplegar `access-log` (`npx supabase@latest functions deploy access-log`). Después, probar en producción: visitas anónimas, login, login fallido, logout, móvil, duración, Excel y que la retención aparezca en `cron.job`
