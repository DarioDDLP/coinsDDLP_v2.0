# coinsDDLP v2.0

> Al cerrar cada sesión de implementación, actualiza las secciones **"Estado actual"** y **"Log de implementación"**.

---

## Descripción del proyecto

Aplicación web para la **gestión de una colección personal de monedas**. Permite visualizar, buscar y filtrar la colección públicamente, y con login habilitado: añadir, editar y borrar monedas.

Es un **monorepo** con tres componentes independientes:

| Carpeta | Componente | Runtime |
|---------|-----------|---------|
| `coins-ddlp-front/` | Aplicación frontend | Angular 21 (Node) |
| `supabase/` | Backend: Edge Functions + migraciones | Deno / PostgreSQL |
| `scripts/` | Utilidades de datos | Python |

---

## Stack tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Frontend | **Angular 21** | Standalone components, Signals, control flow moderno (`@if`, `@for`) |
| Backend / DB | **Supabase PostgreSQL** | SQL, tiempo real nativo (`postgres_changes`) |
| Autenticación | **Supabase Auth** | Login con email/password |
| Backend serverless | **Supabase Edge Functions** | Deno — `admin-users`, `numista-proxy` |
| UI Components | **PrimeNG** | Modales, toasts, tablas, dropdowns, spinners |
| Estilos | **SCSS** | Theming global + estilos por componente |
| Hosting | **Vercel** | Deploy automático en cada push a `main` |

### Características Angular 21 a usar obligatoriamente
- `signal()`, `computed()`, `effect()` — NO usar `BehaviorSubject` para estado local
- `inject()` — NO inyección por constructor
- `@if`, `@for`, `@switch` — NO `*ngIf`, `*ngFor`
- Standalone components (sin `NgModule`)
- `input()` / `output()` signals para comunicación entre componentes
- `toSignal()` / `toObservable()` para interop con RxJS cuando sea necesario
- Lazy loading de rutas con `loadComponent`

---

## Estética y diseño

### Paleta de colores
- **Fondo:** Imagen de fondo (`background.jpg`) a pantalla completa, `background-attachment: fixed`
- **Cards:** Blanco `#ffffff` con opacidad 0.95 y sombra `0 2px 7px rgba(0,0,0,0.3)`
- **Acento dorado:** `#F5E8C7` (fondos de sección features)
- **Sidebar activo:** `#eaeeed` (gris muy claro con borde izquierdo)
- **Estados de conservación:**
  - FDC / SC → `success` (verde `#22c55e`)
  - EBC / MBC → `info` (azul)
  - BC / RC → `warning` (naranja)
  - MC → `danger` (rojo `#ef4444`)

### Layout
- **Sidebar** fijo a la izquierda con logo e items de navegación con icono
- **Contenido principal:** card centrada, 60% de ancho en desktop
- **Breakpoints:** 1500px → 90%, 900px → columna, 576px → 98%, 490px → columna completa
- **Border-radius:** 10px en cards, 50% en banderas (circulares), 15px en feature boxes

### Tipografía
- Labels: 14px
- Descripciones: 18px
- Títulos h1: 25px

---

## Estructura de datos (Supabase PostgreSQL)

### Tabla: `euro`
```typescript
interface EuroCoin {
  id: string;           // UUID texto (Supabase)
  year: integer;
  country: string;
  mint?: string;        // Ceca (identificador de la casa de moneda)
  faceValue: string;    // "1 Céntimo", "2 Euros", etc.
  description: string;  // Descripción / gobernante
  uds: integer;         // Unidades en posesión (0 = no tengo)
  conservation?: string;// Estado: FDC | SC | EBC | MBC | BC | RC | MC | ND
  commemorative?: boolean;
  circulation: boolean; // true = moneda de circulación, false = coleccionista/conmemorativa
  idNum: string;        // ID en catálogo Numista
  observations?: string;
}
```

### Tabla: `peseta_type`

Datos scrapeados de Numista (187 tipos de pesetas circulantes 1868–2001), almacenados en la tabla `peseta_type` de Supabase.

```typescript
interface PesetaType {
  idNum: number;            // ID en catálogo Numista
  title: string;            // "5 Pesetas - Francisco Franco"
  minYear: number;
  maxYear: number;
  category: string;         // "Monedas circulantes normales" | "circulantes conmemorativas"
  faceValueESP: number;     // Valor facial numérico (en pesetas)
  faceValueLabel: string;   // "5 pesetas"
  composition: string;
  weightG: number | null;
  diameterMm: number | null;
  shape: string;
  edge: string;
  orientation: string;
  ruler: string | null;
  demonetized: string | null;
  kmRef: string | null;
  mint: string | null;
  comments: string | null;
  imageObverse: string;
  imageReverse: string;
  imageEdge: string;        // URL vacía si no disponible
  engraverObverse: string | null;
  engraverReverse: string | null;
  descriptionObverse: string | null;
  descriptionReverse: string | null;
  edgeDescription: string | null;
  mintingYears: MintingYear[];  // JSONB — años individuales de acuñación
}

interface MintingYear {
  label: string;       // "1957 (1958) 🟌" — texto tal como aparece en Numista
  designYear: number;  // Año del diseño (puede diferir del año de acuñación)
  mintYear: number;    // Año real de acuñación
  mintage: number | null;
}
```

La tabla `peseta` (525 registros) guarda los ejemplares concretos en posesión, referenciando a `peseta_type`.

**Estadísticas de los datos scrapeados (2026-04-27):** 187 tipos, 692 entradas de mintingYears, 187/187 descripciones anverso/reverso, 158/187 descripciones de canto, 133/187 comentarios, 1/187 fotos de canto.

**Numista currency ID peseta:** `cu=142` (descubierto en `id="c_espagne142"` del HTML de la página de catálogo).

### Estados de conservación
| Código | Nombre | Color PrimeNG |
|--------|--------|---------------|
| ND | No disponible | — |
| FDC | Flor de cuño | success |
| SC | Sin circular | success |
| EBC | Excelente bien conservada | info |
| MBC | Muy bien conservada | info |
| BC | Bien conservada | warning |
| RC | Regular conservación | warning |
| MC | Mal conservada | danger |

---

## Principios SOLID — Aplicación al proyecto

Cada decisión de arquitectura y código debe respetar estos principios:

| Principio | Aplicación concreta |
|-----------|-------------------|
| **S** — Single Responsibility | Cada clase/servicio/componente tiene una única razón para cambiar. `supabase.service.ts` solo gestiona la comunicación con Supabase; `euros.service.ts` solo contiene lógica de negocio de euros. |
| **O** — Open/Closed | Extensible sin modificar. Se usan interfaces para servicios y modelos. Añadir una nueva sección (pesetas, etc.) no obliga a tocar `core`. |
| **L** — Liskov Substitution | Los servicios implementan interfaces (`IEurosRepository`). Los componentes aceptan los tipos que declaran sus `input()` sin restricciones adicionales ocultas. |
| **I** — Interface Segregation | Interfaces pequeñas y específicas. No existe un único `CoinService` con todo: hay `IEurosRepository`, `IAuthService`, etc. Los componentes sólo conocen lo que necesitan. |
| **D** — Dependency Inversion | Los componentes y servicios de alto nivel dependen de abstracciones (interfaces/`InjectionToken`), no de implementaciones concretas. Facilita tests y sustitución. |

### Reglas de codificación derivadas de SOLID
- Un componente **no llama a Supabase directamente**. Siempre a través de su servicio de feature.
- Un servicio de feature **no conoce PrimeNG**. Los toasts y modales son responsabilidad del componente.
- Los literales de texto **nunca van hardcodeados** en templates o servicios: siempre desde `literals.ts`.
- Las interfaces se definen en `shared/interfaces/`. Los servicios las implementan; los componentes las consumen.
- Los helpers (`normalize-strings`, etc.) son **funciones puras** sin estado ni dependencias inyectadas.

---

## Arquitectura de la aplicación (`coins-ddlp-front/src/`)

```
src/
├── app/
│   ├── core/                          # Singletons: una sola instancia en toda la app
│   │   ├── guards/
│   │   │   ├── auth.guard.ts           # Protege operaciones que requieren login
│   │   │   └── admin.guard.ts          # Protege rutas /admin y /herramientas
│   │   └── services/
│   │       ├── supabase.service.ts     # Cliente Supabase — CRUD genérico
│   │       ├── auth.service.ts         # Supabase Auth
│   │       ├── numista.service.ts      # Llamadas a la Edge Function numista-proxy
│   │       ├── loading.service.ts
│   │       └── global-error-handler.service.ts
│   │
│   ├── features/                       # Cada feature, módulo vertical autocontenido
│   │   ├── euros/                      # coin-detail, coin-uds-dialog, euros-all-coins,
│   │   │                               #   euros-countries, euros-year-coins, euros-years
│   │   ├── conmemorativas/             # conmemorativas-list
│   │   ├── pesetas/                    # pesetas-denominations, pesetas-all, pesetas-list,
│   │   │                               #   peseta-detail, peseta-edit-dialog
│   │   ├── estadisticas/               # estadisticas-dashboard
│   │   ├── ubicacion/                  # ubicacion-map
│   │   ├── admin/                      # admin-users, admin-user-dialog, admin-header
│   │   └── tools/                      # tools-add-euro, tools-add-year
│   │
│   ├── shared/                         # Reutilizable entre features, sin lógica de negocio
│   │   ├── components/                 # badge, button, buttons-header, collection-layout,
│   │   │                               #   confirm-dialog, country-flag, empty-panel,
│   │   │                               #   loading-spinner, login-dialog, search-input,
│   │   │                               #   select, sidebar, text-input, textarea, toggle,
│   │   │                               #   recovery-password-dialog
│   │   ├── constants/                  # literals.ts, conservation-states.const.ts,
│   │   │                               #   toast-messages.const.ts, collections.const.ts
│   │   ├── interfaces/                 # contratos: euro-coin, peseta, numista-coin,
│   │   │                               #   auth-service, euros-repository, app-user...
│   │   ├── helpers/                    # funciones puras: normalize-strings, search-state, badge
│   │   ├── pipes/                      # euro-value.pipe.ts
│   │   └── services/                   # excel-export.service.ts
│   │
│   ├── app.ts                          # Componente raíz: layout sidebar + <router-outlet>
│   ├── app.config.ts                   # Providers: cliente Supabase, Router, HttpClient,
│   │                                   #   Animations, PrimeNG, GlobalErrorHandler
│   └── app.routes.ts                   # Rutas raíz con lazy loading
│
├── environments/                       # environment.ts, environment.prod.ts
├── styles/  ·  styles.scss              # Theming global PrimeNG + reset
└── (assets estáticos en coins-ddlp-front/public/: flags/, icons/, background.jpg)
```

### Regla de dependencias entre capas
```
features → shared → (sin dependencias)
features → core   → (sin dependencias)
core     → shared → (sin dependencias)

features NO importan de otras features.
shared   NO importa de core ni de features.
```

---

## Rutas

```typescript
// Rutas públicas (visualización)
/                    → redirect → /euros
/euros               → EurosComponent (lazy, con rutas hijas)
/conmemorativas      → ConmemorativasComponent (lazy)
/pesetas             → PesetasComponent (lazy, con rutas hijas)
/estadisticas        → EstadisticasDashboardComponent (lazy)
/ubicacion           → UbicacionMapComponent (lazy)

// Rutas protegidas con adminGuard
/admin               → AdminComponent (lazy, con rutas hijas)
/herramientas        → ToolsComponent (lazy, con rutas hijas)

/**                  → redirect → /euros
```

- **No existe ruta `/login`**: el login es un `p-dialog` (`login-dialog`) que se abre desde cualquier punto.
- Las acciones CRUD se hacen mediante modales dentro de las rutas públicas; `authGuard` controla la visibilidad de los botones de edición/borrado.

---

## Supabase

### Proyecto Supabase
- **URL:** `https://uvkvagoipxgagyupxoqd.supabase.co`
- **Anon Key:** guardada en `coins-ddlp-front/src/environments/environment.ts`
- **Auth:** Email/Password habilitado en Supabase Auth
- **PostgreSQL:** tabla `euro` con 5.441 registros migrados desde archivo de exportación
- **RLS:** activado en `euro`, `peseta`, `peseta_type` — `anon` solo lectura, `authenticated` lectura+escritura

### Edge Functions (`supabase/functions/`)
- `numista-proxy` — proxy a la API de Numista (oculta la `NUMISTA_API_KEY`)
- `admin-users` — gestión de usuarios desde la sección admin

Los secretos (`SUPABASE_SERVICE_ROLE_KEY`, `NUMISTA_API_KEY`) se configuran en el panel de Supabase, **no** en ficheros locales.

### Cliente en `app.config.ts`
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('supabase-client');

// dentro de appConfig.providers:
{
  provide: SUPABASE_CLIENT,
  useFactory: () => createClient(environment.supabase.url, environment.supabase.anonKey),
}
```

---

## Estado actual

> **Última actualización:** 2026-05-28

### URL de producción
**https://coinsddlp.vercel.app** — deploy automático en cada push a `main` (Vercel, plan Hobby)

### Pendiente / Próximos pasos
1. **Implementar sección Estadísticas** — el componente `estadisticas-dashboard` existe; falta el contenido
2. **Implementar sección Ubicación** — el componente `ubicacion-map` existe; falta el contenido

---

## Log de implementación (últimas sesiones)

| Fecha | Cambio |
|-------|--------|
| 2026-04-23 | **Conmemorativas**: módulo completo (solo lectura), agrupado por año asc, ordenado por país. Columna Ceca (150px), columna Álb/H/Pos solo admin. `maxWidth` input en `collection-layout`. Config en `conmemorativas.config.ts`. |
| 2026-04-24 | **Scripts Numista**: `match-numista-ids-regular.mjs` asignó idNum a 4425 monedas (247 tipos). Todos los regulares tienen idNum. 370 conmemorativas pendientes. |
| 2026-04-26 | **UX listados**: ellipsis en columna descripción de euros-year-coins. `search-state.helper.ts` con `sessionStorage` para persistir buscadores al navegar atrás (5 componentes). Conmemorativas: filas clickables con `?from=conmemorativas`, `coin-detail` ajusta backLink. |
| 2026-04-27 | **Scraping pesetas**: script Python extrajo 187 tipos de pesetas circulantes (1868–2001) de Numista. 692 entradas mintingYears. Numista currency ID peseta: `cu=142`. |
| 2026-04-28 | **Módulo pesetas completo**: tablas `peseta_type` (187) y `peseta` (525) en Supabase. `PesetasService` con join. Rutas: denominaciones, todas agrupadas, lista por `:faceValue`. Búsqueda en todos los listados. |
| 2026-04-30 | **Detalle peseta** (`PesetaDetailComponent`): ruta `/:faceValue/:id` antes de `/:faceValue`. `PesetasService.getById()`. Layout idéntico a `coin-detail` (imágenes, descripciones, features-box con 14 campos + tirada con `DecimalPipe`). Sin llamada Numista. Filas clickables en list y all. |
| 2026-05-05 | **Exportar Excel**: `ExcelExportService` en `shared/services/` con ExcelJS. Slot `[layout-actions]` en `CollectionLayoutComponent`. Botón "Exportar Excel" en `euros-year-coins`, `euros-all-coins` y `conmemorativas-list`. Cabeceras deep-navy con texto cream. Conmemorativas: una hoja por año. |
| 2026-05-05 | **Deploy a Vercel**: `vercel.json` con rewrite SPA. URL: https://coinsddlp.vercel.app. Vercel Analytics via script tag en `index.html`. Deploy automático en cada push a `main`. |
| 2026-05-08 | **Acceso admin**: secciones Estadísticas y Ubicación restringidas solo a admin. |
| 2026-05-12 | **UI**: favicon y título general de la app. |
| 2026-05-18 | **Seguridad — RLS**: migración `20260518000000_enable_rls.sql` activa Row-Level Security en `euro`, `peseta`, `peseta_type`. Políticas: `anon` solo lectura, `authenticated` lectura+escritura. Resuelve aviso `rls_disabled_in_public` del Security Advisor. Aplicada a producción con `supabase db push`. |
| 2026-05-18 | **Detalle moneda**: distinguir error de cuota de Numista de un `idNum` ausente. **Estilos**: hover de fila más marcado, colores `rgba` centralizados en variables CSS. |
| 2026-05-19 | **Reorganización del repo (sesión 12)**: `CONTEXT.md` renombrado a `CLAUDE.md` (auto-carga). Eliminado el proyecto npm muerto de la raíz (`package.json`, `node_modules`, `.env`) — eran de scripts de Node ya difuntos. `swagger.yaml` (spec API Numista) movido a la raíz. `.DS_Store` añadido al `.gitignore`. Migración RLS y `scrape_ucoin.py` añadidos a git. Borrado el proyecto base `coinsDDLP` v1. |
| 2026-05-28 | **Segunda colección (Manolo) — completa**: Migración SQL `20260528000002_add_euro_ownership.sql`: tablas `owner` y `euro_ownership`, migración de datos de Darío, RLS + grants. `FilterPillsComponent` genérico con `OWNERSHIP_FILTER_OPTIONS` y `OWNER_FILTER_OPTIONS` (config separadas). `OwnerService` singleton (`dario/manolo/ambas`, persistido en sessionStorage). `EurosService` y `ConmemorativasService` con LEFT JOIN a `euro_ownership`, mapeo por modo, `update()` dividido entre `euro` y `euro_ownership`. 3 componentes de tabla con selector de owner (izquierda) + filtro posesión (derecha), recarga reactiva con `effect()`, columnas dobles en modo *ambas*. `coin-uds-dialog` con picker de colección visible solo en modo *ambas* + admin. `tools-add-euro` y `tools-add-year` simplificados: solo catálogo (`NewEuroCoin`), sin campos de posesión. |

---

## Notas y decisiones técnicas

### Angular
- **No usar `NgModule`**: todo standalone, `provideX()` en `app.config.ts`
- **Signals everywhere**: estado reactivo de UI con signals, no con RxJS subjects
- **RxJS**: el SDK de Supabase es basado en Promesas; usar RxJS solo para interop puntual (`toSignal()`)
- **Guards**: funcionales con `inject()` — NO class-based guards

### PrimeNG
- Usar el sistema de temas con CSS variables y `definePreset` (preset `Aura` personalizado en `app.config.ts`)
- Importar componentes individualmente en cada standalone component (ISP)

### Autenticación
- El login abre un `p-dialog` (`login-dialog`) desde cualquier punto de la app. No existe página `/login` separada.
- Los botones de edición/borrado solo son visibles cuando `authService.isLoggedIn()` es `true`
- `authGuard` protege operaciones; `adminGuard` protege las rutas `/admin` y `/herramientas`

### Literales (`shared/constants/literals.ts`)
- **Ningún texto** va hardcodeado en templates (`.html`) ni en servicios
- Estructura por secciones: `LITERALS.euros.title`, `LITERALS.shared.loading`, `LITERALS.auth.loginButton`, etc.
- Los `toast-messages.const.ts` importan sus textos desde `literals.ts`

### Imágenes
- Banderas: normalizar nombre del país → buscar en `public/assets/flags/{nombre-normalizado}-flag.png`
- Conservación ND: valor por defecto cuando `uds === '0'`

### Manejo de errores — patrón obligatorio

Todo componente que haga llamadas asíncronas (Observable o Promise) debe:

1. **Inyectar `ErrorHandler`** de `@angular/core`:
   ```ts
   private errorHandler = inject(ErrorHandler);
   ```

2. **En callbacks `error:` de `subscribe`** — llamar a `handleError` antes de actualizar estado local:
   ```ts
   error: (e) => { this.errorHandler.handleError(e); this.hasError.set(true); this.isReady.set(true); }
   ```

3. **En bloques `catch` de `async/await`** — ídem:
   ```ts
   } catch (e) { this.errorHandler.handleError(e); /* estado local */ }
   ```

El `GlobalErrorHandler` (`core/services/global-error-handler.service.ts`) extrae el mensaje del error con esta prioridad:
- Status 0 → "Comprueba tu conexión e inténtalo de nuevo"
- `error.error.message` → body JSON de `HttpErrorResponse` (Supabase REST estándar)
- `error.error.error` → body de nuestras Edge Functions (`{ error: "mensaje" }`)
- `error.message` → `Error` JS / `PostgrestError` del SDK
- Fallback → "Ha ocurrido un error inesperado"

Los servicios **nunca** muestran toasts ni llaman a `ErrorHandler` — esa responsabilidad es siempre del componente.

---

### Lo que NO se hace (anti-patterns prohibidos)
- `*ngIf` / `*ngFor` → usar `@if` / `@for`
- Constructor injection → usar `inject()`
- `BehaviorSubject` para estado de UI → usar `signal()`
- Texto hardcodeado → importar de `literals.ts`
- Un componente llama a Supabase directamente → pasar siempre por el servicio de feature
- Servicios de feature conocen PrimeNG → los toasts/modales son del componente
- Features importando de otras features → solo de `shared/` y `core/`
