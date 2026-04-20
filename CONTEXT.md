# coinsDDLP v2.0 — Prompt de contexto del proyecto

> **Instrucción para Claude**: Lee este fichero al inicio de cada conversación para recuperar el contexto completo del proyecto. Al finalizar cada sesión de implementación, actualiza las secciones **"Estado actual"** y **"Próximos pasos"** con los cambios realizados.

---

## Descripción del proyecto

Aplicación web para la **gestión de una colección personal de monedas**. Permite visualizar, buscar y filtrar la colección públicamente, y con login habilitado: añadir, editar y borrar monedas.

**Nombre del proyecto:** coinsDDLP_v2.0  
**Carpeta:** `/Users/dariodelapoza/Documents/Proyectos/coinsDDLP_v2.0/`  
**Referencia estética:** `/Users/dariodelapoza/Documents/Proyectos/coinsDDLP/coins-ddlp-front/`

---

## Stack tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Frontend | **Angular 21** | Standalone components, Signals, control flow moderno (`@if`, `@for`) |
| Backend / DB | **Supabase PostgreSQL** | SQL, tiempo real nativo (postgres_changes), sin límite de operaciones |
| Autenticación | **Supabase Auth** | Login con email/password, integrado en PostgreSQL |
| UI Components | **PrimeNG (última versión)** | Modales, toasts, tablas, dropdowns, spinners |
| Estilos | **SCSS** | Global theming + estilos por componente |
| Hosting | **Firebase Hosting** (opcional) o **Vercel/Netlify** | |

### Características Angular 21 a usar obligatoriamente
- `signal()`, `computed()`, `effect()` — NO usar `BehaviorSubject` para estado local
- `inject()` — NO inyección por constructor
- `@if`, `@for`, `@switch` — NO `*ngIf`, `*ngFor`
- Standalone components (sin `NgModule`)
- `input()` / `output()` signals para comunicación entre componentes
- `toSignal()` / `toObservable()` para interop con RxJS cuando sea necesario
- Lazy loading de rutas con `loadComponent`

---

## Estética y diseño (referencia v1)

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
| **S** — Single Responsibility | Cada clase/servicio/componente tiene una única razón para cambiar. `firestore.service.ts` solo gestiona la comunicación con Firestore; `euros.service.ts` solo contiene lógica de negocio de euros. |
| **O** — Open/Closed | Extensible sin modificar. Se usan interfaces para servicios y modelos. Añadir una nueva sección (pesetas, etc.) no obliga a tocar `core`. |
| **L** — Liskov Substitution | Los servicios implementan interfaces (`IEurosRepository`). Los componentes aceptan los tipos que declaran sus `input()` sin restricciones adicionales ocultas. |
| **I** — Interface Segregation | Interfaces pequeñas y específicas. No existe un único `CoinService` con todo: hay `IEurosRepository`, `IAuthService`, etc. Los componentes sólo conocen lo que necesitan. |
| **D** — Dependency Inversion | Los componentes y servicios de alto nivel dependen de abstracciones (interfaces/`InjectionToken`), no de implementaciones concretas de Firebase. Facilita tests y sustitución. |

### Reglas de codificación derivadas de SOLID
- Un componente **no llama a Firestore directamente**. Siempre a través de su servicio de feature.
- Un servicio de feature **no conoce PrimeNG**. Los toasts y modales son responsabilidad del componente.
- Los literales de texto **nunca van hardcodeados** en templates o servicios: siempre desde `literals.ts`.
- Las interfaces se definen en `shared/interfaces/`. Los servicios las implementan; los componentes las consumen.
- Los helpers (`normalize-strings`, etc.) son **funciones puras** sin estado ni dependencias inyectadas.

---

## Arquitectura de la aplicación

```
src/
├── app/
│   ├── core/                              # Singleton: una sola instancia en toda la app
│   │   ├── guards/
│   │   │   └── auth.guard.ts              # Funcional, con inject(Auth)
│   │   └── services/
│   │       ├── auth.service.ts            # SRP: solo Firebase Auth
│   │       └── firestore.service.ts       # SRP: CRUD genérico sobre Firestore (DIP)
│   │
│   ├── features/                          # Cada feature es un módulo vertical autocontenido
│   │   ├── euros/
│   │   │   ├── components/
│   │   │   │   ├── euros-countries/       # Listado de países con búsqueda
│   │   │   │   ├── euros-years/           # Años de un país con búsqueda
│   │   │   │   └── euros-year-coins/      # Monedas de un país/año con tabla
│   │   │   ├── services/
│   │   │   │   └── euros.service.ts       # Lógica de negocio de euros (usa FirestoreService)
│   │   │   └── euros.routes.ts            # Rutas lazy de la feature
│   │   ├── conmemorativas/
│   │   │   ├── components/
│   │   │   │   └── conmemorativas-list/
│   │   │   ├── services/
│   │   │   │   └── conmemorativas.service.ts
│   │   │   └── conmemorativas.routes.ts
│   │   ├── pesetas/
│   │   │   ├── components/
│   │   │   │   └── pesetas-list/
│   │   │   ├── services/
│   │   │   │   └── pesetas.service.ts
│   │   │   └── pesetas.routes.ts
│   │   ├── estadisticas/
│   │   │   ├── components/
│   │   │   │   └── estadisticas-dashboard/
│   │   │   ├── services/
│   │   │   │   └── estadisticas.service.ts
│   │   │   └── estadisticas.routes.ts
│   │   └── ubicacion/
│   │       ├── components/
│   │       │   └── ubicacion-map/
│   │       └── ubicacion.routes.ts
│   │
│   ├── shared/                            # Reutilizable entre features, sin lógica de negocio
│   │   ├── components/                    # Componentes genéricos de UI
│   │   │   ├── sidebar/                   # Navegación lateral
│   │   │   ├── coin-badge/                # Badge de estado de conservación (ISP: solo recibe el código)
│   │   │   ├── country-flag/              # Imagen de bandera circular por país
│   │   │   └── loading-spinner/           # Spinner genérico de carga
│   │   ├── constants/                     # Literales y constantes — NUNCA hardcodear texto
│   │   │   ├── literals.ts                # Todos los textos de UI (labels, mensajes, placeholders)
│   │   │   ├── conservation-states.const.ts
│   │   │   └── toast-messages.const.ts    # Textos de notificaciones (importa de literals.ts)
│   │   ├── interfaces/                    # Contratos (DIP, ISP)
│   │   │   ├── euro-coin.interface.ts
│   │   │   ├── conservation-state.interface.ts
│   │   │   ├── euros-repository.interface.ts   # IEurosRepository (implementa euros.service.ts)
│   │   │   └── auth-service.interface.ts        # IAuthService
│   │   ├── pipes/
│   │   │   └── euro-value.pipe.ts         # SRP: solo formateo de valor facial
│   │   └── helpers/                       # Funciones puras sin estado
│   │       └── normalize-strings.helper.ts
│   │
│   ├── app.component.ts                   # Layout raíz: sidebar + <router-outlet>
│   ├── app.config.ts                      # Providers: Firebase, Router, Animations, PrimeNG
│   └── app.routes.ts                      # Rutas raíz con lazy loading a feature.routes.ts
│
├── assets/
│   ├── flags/                             # Banderas por país
│   ├── icons/                             # Iconos del sidebar
│   └── background.jpg
└── styles.scss                            # Theming global PrimeNG + reset
```

### Regla de dependencias entre capas
```
features → shared → (no dependencies)
features → core   → (no dependencies)
core     → shared → (no dependencies)

features NO importan de otras features.
shared   NO importa de core ni de features.
```

---

## Rutas

```typescript
// Rutas públicas (sólo visualización)
/                    → redirect → /euros
/euros               → EurosListComponent (lazy)
/euros/:id           → EurosDetailComponent (lazy)
/conmemorativas      → ConmemorativasComponent (lazy)
/pesetas             → PesetasComponent (lazy)
/estadisticas        → EstadisticasComponent (lazy)
/ubicacion           → UbicacionComponent (lazy)

// Ruta de autenticación
/login               → LoginComponent (lazy)

// Rutas protegidas con authGuard (sólo con login)
// Las acciones CRUD se hacen mediante modales dentro de las rutas públicas
// El authGuard controla la visibilidad de botones de edición/borrado
```

---

## Funcionalidades

### Modo público (sin login)
- [x] Ver listado de monedas euro con búsqueda y filtros
- [x] Ver detalle de cada moneda
- [x] Filtrar por: país, año, valor facial, conmemorativa, estado de posesión
- [ ] Ver estadísticas de la colección (totales, por país, por valor)
- [ ] Ver sección de pesetas
- [ ] Ver sección de conmemorativas
- [ ] Ver ubicación física

### Modo edición (con login)
- [ ] Login con email/password via Firebase Auth
- [ ] Añadir nueva moneda (modal con formulario)
- [ ] Editar moneda (modal): estado conservación, unidades, observaciones
- [ ] Borrar moneda (confirmación con modal)
- [ ] Logout

### Módulo de administración (solo admins)
- [ ] Acceso restringido con guard de rol admin (custom claim en Firebase Auth)
- [ ] Listar todos los usuarios registrados
- [ ] Dar de alta nuevos usuarios
- [ ] Editar usuarios (email, nombre, rol)
- [ ] Eliminar usuarios
- [ ] Ruta protegida: `/admin/usuarios`

---

## Supabase

### Proyecto Supabase
- **URL:** `https://uvkvagoipxgagyupxoqd.supabase.co`
- **Anon Key:** Guardada en `src/environments/environment.ts`
- **Auth:** Email/Password habilitado en Supabase Auth
- **PostgreSQL:** Tabla `euro` con 5.441 documentos migrados desde archivo de exportación

### Configuración en `app.config.ts`
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('supabase-client');

export const appConfig: ApplicationConfig = {
  providers: [
    // ...
    {
      provide: SUPABASE_CLIENT,
      useFactory: () => createClient(environment.supabase.url, environment.supabase.anonKey),
    },
  ],
};
```

---

## PrimeNG — Componentes previstos

| Componente PrimeNG | Uso |
|-------------------|-----|
| `p-table` / `p-datatable` | Listado de monedas |
| `p-dialog` | Modal de edición / añadir moneda |
| `p-confirmDialog` | Confirmación de borrado |
| `p-toast` | Notificaciones de éxito/error |
| `p-tag` | Badge de estado de conservación |
| `p-progressSpinner` | Loading state |
| `p-inputText` | Búsqueda |
| `p-dropdown` / `p-select` | Filtros y selección de estado |
| `p-inputNumber` | Número de unidades |
| `p-textarea` | Observaciones |
| `p-button` | Acciones |
| `p-tooltip` | Hints informativos |
| `p-sidebar` / `p-menu` | Navegación lateral |

---

## Comandos del proyecto

```bash
# Crear proyecto (desde coinsDDLP_v2.0/)
ng new coins-ddlp-front --standalone --style=scss --routing

# Instalar dependencias
npm install @angular/fire firebase
npm install primeng primeicons

# Servidor de desarrollo
ng serve

# Build producción
ng build --configuration production
```

---

## Estado actual

> **Última actualización:** 2026-04-19 (sesión 4)

### Implementado ✅
- [x] Fichero de contexto CONTEXT.md creado y actualizado
- [x] Proyecto Angular 21 inicializado (v21.2.7, standalone, SCSS, sin SSR)
- [x] Estructura de carpetas creada (core, features, shared con subcarpetas completas)
- [x] Supabase JS SDK instalado (`@supabase/supabase-js`)
- [x] PrimeNG 21 + @primeng/themes instalados
- [x] @angular/animations instalado (requerido por provideAnimationsAsync)
- [x] Interfaces: `EuroCoin`, `ConservationState`, `AppUser`, `IAuthService`, `IEurosRepository`
- [x] Constantes: `LITERALS`, `CONSERVATION_STATES`, `CONSERVATION_MAP`, `TOAST_MESSAGES`, `TABLES`
- [x] Helper: `normalizeCountryName`, `getFlagPath`, `normalizeString` (genérica, usada en los 3 buscadores)
- [x] Pipe: `EuroValuePipe` (standalone)
- [x] `AuthService` — signal + Supabase Auth (onAuthStateChange)
- [x] `SupabaseService` — genérico, tipado, soporte para tiempo real (postgres_changes)
- [x] `app.config.ts` — createClient(Supabase) + SUPABASE_CLIENT InjectionToken + provideRouter + providePrimeNG
- [x] `app.routes.ts` — rutas raíz con lazy loading, redirect `/` → `/euros`, wildcard → `/euros`
- [x] Layout raíz — `app.ts` con SidebarComponent + router-outlet, fondo en body (global)
- [x] `SidebarComponent` — glassmorphism, azul marino #1e3a5f, items desde sidebar.config.ts con LITERALS
- [x] Assets en `public/assets/` (background.jpg, logo, banderas, iconos)
- [x] Paleta de colores en `src/styles/_variables.scss` — CSS vars + SCSS vars
- [x] Tipografía en `src/styles/_typography.scss` — Montserrat (Google Fonts)
- [x] Shared component: `badge` — píldora genérica (label, severity, size, tooltip). Sustituye a `coin-badge`, `role-badge` y `unit-badge`. Mapeo en `shared/helpers/badge.helpers.ts` (`getConservationBadge`, `getUdsBadge`, `getRoleBadge`)
- [x] Shared component: `country-flag` — imagen circular configurable
- [x] Shared component: `button` — variantes primary, secondary, tertiary, danger, ghost
- [x] Shared component: `collection-layout` — input `cardBackground` configurable, botón volver con `app-button` tertiary, bandera y título a la derecha
- [x] `euros.service.ts` implementando IEurosRepository (usa SupabaseService)
- [x] **Migración Firebase → Supabase completada** — 5.441 documentos importados desde archivo de exportación, sin duplicados
- [x] **Firebase completamente removido** — desinstalado npm, sin referencias en código
- [x] **Tiempo real Supabase funcional** — postgres_changes para sincronización en vivo
- [x] **euros-year-coins** — tabla con header deep-navy/cream, estriado, card blanca, búsqueda por faceValue/description, unit-badge, icono edición (sin funcionalidad), filas no circulantes sombreadas en gold-tan, leyenda de no circulantes
- [x] **coin-detail** — vista de detalle de moneda individual. Usa `collection-layout`. Carga datos de Supabase + Numista API via Edge Function proxy. Muestra imágenes anverso/reverso/canto, características técnicas (features box cream) y observaciones
- [x] **NumistaService** — proxy via Supabase Edge Function `numista-proxy` (sin CORS, sin JWT). Expone signal `remaining()` con peticiones restantes del mes
- [x] **numista-proxy Edge Function** — desplegada en Supabase. Llama a Numista server-side, registra cada llamada en tabla `numista_usage`, devuelve `X-Numista-Remaining` en header
- [x] **Contador Numista en sidebar** — muestra "Numista X / 2000" cuando hay datos disponibles
- [x] **collection-layout** — buscador opcional, fondo eliminado (responsabilidad del módulo padre)
- [x] **provideHttpClient()** añadido a `app.config.ts`
- [x] Ruta `/euros/:country/:year/:id` — navega al detalle de moneda al hacer click en fila de euros-detail
- [x] **Sistema de spinner refactorizado** — `LoadingService.withLoading()` operador RxJS; activado en `EurosService` y `NumistaService`; `SupabaseService` limpio (solo datos); `observer.complete()` añadido
- [x] **EurosComponent** — layout padre del módulo euros con fondo `background.jpg` en `:host`; rutas hijas en `euros.routes.ts`
- [x] **isReady signal** — todos los componentes del módulo euros esperan a tener datos antes de renderizar (sin card en blanco durante la carga)
- [x] **EmptyPanelComponent** — componente shared para estados de error y vacío: card cremosa, icono, título, mensaje y botón reintentar opcional
- [x] **Sistema de autenticación completo** — AppUser con `role` y `displayName`, `AuthService` con `isLoggedIn`/`isAdmin` computed(), `authGuard`/`adminGuard` funcionales, `LoginDialogComponent` (email/password, error inline, toast), `SidebarComponent` con login/logout, badge Admin y displayName con fallback a email. Usuario admin asignado vía Supabase Admin API.
- [x] **Toasts** — posición `top-right`, `summary` desde `LITERALS.shared` (Éxito/Error/Información), `detail` con el mensaje. Todas las llamadas usan `TOAST_MESSAGES`.
- [x] **LoginDialogComponent modo logout** — `mode` input `'login' | 'logout'`. En modo logout muestra confirmación con botones Cancelar (primary, izquierda) y Confirmar (danger, derecha). `header` como `computed()`.
- [x] **Módulo admin completo** — `AdminComponent` (padre con fondo + `effect()` redirect a `/euros` al cerrar sesión), `AdminHeaderComponent` (título + nav desde `admin-header.config.ts`), `AdminUsersComponent` (tabla de usuarios), `AdminService` (JWT via `withAuth()`), Edge Function `admin-users` (list/create/update/delete, verifica rol admin en JWT, deployada con `--no-verify-jwt`). Sidebar muestra item Admin solo si `isAdmin()`.
- [x] **Flujo forgot password** — `LoginDialogComponent` ampliado con vista `'forgot'`: campo email + botón "Enviar enlace" (`supabase.auth.resetPasswordForEmail`). Link "¿Olvidaste tu contraseña?" en la vista login. Confirmación inline tras envío.
- [x] **RecoveryPasswordDialogComponent** — modal global en `AppComponent`. Se activa con signal `isRecoveryMode` en `AuthService` al detectar evento `PASSWORD_RECOVERY` en `onAuthStateChange`. Formulario nueva contraseña + confirmar. Llama a `supabase.auth.updateUser({ password })`. Sin botón cerrar (`[closable]="false"`).
- [x] **Redirect a /euros tras logout** — `LoginDialogComponent` navega a `/euros` después de confirmar cierre de sesión.
- [x] **Admin tabla usuarios** — cabecera deep-navy/cream, columnas Rol y Acciones centradas, fondo `background-admin.png`.
- [x] **Eliminar usuario** — `AdminUserDialogComponent` con modo `'delete'`: confirmación Cancelar/Confirmar. `AdminUsersComponent` con signal `dialogMode` (`'edit' | 'delete'`). Llama a Edge Function DELETE.
- [x] **euros-year-coins botón añadir unidades** — icono `pi-plus-circle` ghost, solo visible para admin (`isAdmin()`). `stopPropagation` en `td` para no disparar navegación al detalle. Sin funcionalidad aún.
- [x] **Shared component: `text-input`** — input nativo con SCSS propio (sin PrimeNG). Label integrado, tipos text/email/password/number, inputs `min`/`max`, outputs `valueChange` y `enterPressed`. `--placeholder` añadido a `_variables.scss`. Refactoriza `login-dialog`, `recovery-password-dialog` y `admin-user-dialog`.
- [x] **Shared component: `select`** — envuelve `p-select` con API propia (`label`, `value`, `options`, `placeholder`, `disabled`, `valueChange`). Estilos del panel/opciones configurados via `definePreset` en `app.config.ts` (tokens `root`, `option`, `overlay`). `appendTo="body"` para evitar cierre al hacer scroll dentro del panel en dialogs. Refactoriza `admin-user-dialog`.
- [x] **`definePreset` en `app.config.ts`** — personaliza tokens del componente `select` de PrimeNG (border cobalt, focus gold-tan, opciones cream/cobalt/deep-navy). Colores en hex (las CSS vars no son resolvibles en tiempo de compilación).
- [x] **`CoinUdsDialogComponent`** — modal para editar `uds` y `conservation` desde `euros-year-coins`. `app-text-input` (type=number, min=0) + `app-select` con `CONSERVATION_OPTIONS`. Llama a `eurosService.update()`, toast, recarga tabla. `effect()` sincroniza valores al abrir.
- [x] **Tooltip en `app-button` y `app-badge`** — input `tooltip` con `pTooltip` interno. `TooltipModule` importado en el propio componente shared. Eliminado de los componentes padre (admin-users, euros-year-coins). Corregido "null" en badge sin tooltip.
- [x] **Shared component: `textarea`** — textarea nativo estilizado, mismo SCSS que `text-input`. Inputs: `label`, `value`, `placeholder`, `rows` (default 3), `disabled`. Output: `valueChange`.
- [x] **`CoinUdsDialogComponent` ampliado** — edita también `observations` via `app-textarea`. Los tres campos (uds, conservation, observations) se guardan en un único `eurosService.update()`.
- [x] **Vista "Todas" (`EurosAllCoinsComponent`)** — muestra todas las monedas de un país agrupadas por año. Ruta `/euros/:country/all` añadida en `euros.routes.ts` antes de `:country/:year`. Card "Todas" aparece en el mismo `year-grid` que las cards de año. Tabla `p-table` con `rowGroupMode="subheader"` y `groupRowsBy="year"`, ordenada por año ASC + valor facial. Mismo dialog de edición que `euros-year-coins`.
- [x] **Back navigation desde "Todas"** — `onCoinClick` navega a `/euros/:country/all/:id` (no al año real). `coin-detail` construye el backLink con el param `:year` de la URL, que en este caso es `'all'`, devolviendo correctamente a la vista "Todas".
- [x] **Paginación `SupabaseService` corregida** — añadido `.order('id', { ascending: true })` en el while-loop de `getTableWhere` para garantizar orden determinista entre páginas y evitar resultados vacíos en páginas > 1.
- [x] **Shared component: `toggle`** — envuelve `p-toggleswitch` de PrimeNG. Inputs: `label`, `value`, `disabled`. Output: `valueChange`. Layout horizontal: label izquierda, switch derecha.
- [x] **`CoinUdsDialogComponent` ampliado** — edita también `circulation` (boolean) via `app-toggle`. El campo se sincroniza en el `effect()` y se guarda junto al resto de campos.

### Pendiente / Próximos pasos
1. **Editar email usuario en admin** — campo email editable en `AdminUserDialogComponent` modo edición + actualizar `AdminService.updateUser()` y Edge Function PATCH
2. **Secciones restantes** — conmemorativas, pesetas, estadísticas, ubicación (cada una con su propio componente padre de módulo y fondo)

---

## Log de implementación

| Fecha | Cambio |
|-------|--------|
| 2026-04-06 | Proyecto iniciado. CONTEXT.md y hook creados. |
| 2026-04-06 | Arquitectura refactorizada: SOLID explícito, carpeta `shared/components/` genéricos, `shared/constants/literals.ts`, regla de dependencias entre capas, anti-patterns prohibidos. |
| 2026-04-06 | Proyecto Angular 21 creado. Firebase JS SDK + PrimeNG 21 instalados (@angular/fire incompatible con Angular 21). |
| 2026-04-06 | Capa de fundación completa: interfaces, constantes, helpers, pipe, AuthService y FirestoreService. Decisiones: year/uds como number, ConservationCode union type, AppUser agnóstico de Firebase, Observable para lecturas / Promise para escrituras, lazy getters para Firebase, CollectionName type para evitar magic strings. |
| 2026-04-07 | app.config.ts, app.routes.ts y layout raíz. SidebarComponent con glassmorphism y azul marino. Assets en public/assets/. @primeng/themes y @angular/animations instalados. Login es p-dialog, no ruta separada. |
| 2026-04-07 | Paleta de colores definida (cobalt #2d3a7a, gold-tan #d9b582, cream #fff5e8, deep-navy #151465, midnight #040339). Sidebar con degradado y estilos coherentes con la paleta. |
| 2026-04-07 | Tipografía Montserrat (Google Fonts) con variables CSS de tamaño, peso, line-height y letter-spacing en _typography.scss. |
| 2026-04-08 | `CoinBadgeComponent` — badge de estado de conservación con SCSS puro (sin PrimeNG). Decisión: usar SCSS vars en lugar de CSS custom properties para colores estáticos. Colores de estado añadidos a `_variables.scss`. |
| 2026-04-08 | `CountryFlagComponent` — imagen circular configurable via `[size]` input, fallback `(error)`. Helper `getFlagPath` corregido (sufijo `-flag.png`) y añadido `.trim()` en normalización. |
| 2026-04-12 | **Migración completa Firebase → Supabase**: 1) AuthService adaptado a Supabase Auth. 2) FirestoreService reemplazado por SupabaseService (tiempo real con postgres_changes). 3) Migración rehecha desde archivo de exportación: 5.441 documentos a PostgreSQL sin duplicados. 4) Firebase completamente removido (78 paquetes npm desinstalados). 5) App compilando y cargando datos correctamente. |
| 2026-04-13 | **Mejoras visuales euros-detail**: tabla con card blanca, header deep-navy/cream, estriado, búsqueda funcional (faceValue + description con normalización de acentos), unit-badge, icono edición (sin funcionalidad), filas no circulantes sombreadas en gold-tan. `normalizeString` extraída como helper genérico y usada en los 3 buscadores. Botón volver reemplazado por `app-button`. Nueva variante `tertiary` en ButtonComponent. Input `cardBackground` en CollectionLayoutComponent. |
| 2026-04-14 | **coin-detail**: vista de detalle de moneda con integración Numista via Supabase Edge Function proxy. Datos de Supabase + Numista combinados. Usa `collection-layout` como wrapper. Leyenda de no circulantes en euros-detail. Contador de peticiones Numista en sidebar (signal `remaining()` + tabla `numista_usage`). Buscador opcional en `collection-layout`. `provideHttpClient()` añadido. |
| 2026-04-17 | **Sistema auth completo**: AppUser con role y displayName (user_metadata.full_name), AuthService con isLoggedIn/isAdmin como computed() desde JWT, authGuard/adminGuard funcionales, LoginDialogComponent, SidebarComponent con login/logout/badge Admin/displayName con fallback a email. Botón logout centrado. Rol admin asignado vía Supabase Admin API. |
| 2026-04-17 | **Refactor spinner**: `LoadingService.withLoading()` operador RxJS, spinner centralizado en feature services, `SupabaseService` limpio, `observer.complete()` añadido, color mensaje spinner corregido. **EurosComponent** como layout padre del módulo con fondo propio. **isReady** en todos los componentes del módulo. **EmptyPanelComponent** para errores y estados vacíos con card cremosa y botón reintentar. |
| 2026-04-17 | **UX toasts y login/logout**: toasts movidos a `top-right` con summary/detail desde LITERALS. `LoginDialogComponent` refactorizado con `mode` input para reutilizar como confirmación de logout. Botón entrar alineado a la derecha. Separación `margin-top` en acciones. |
| 2026-04-17 | **Módulo admin**: `AdminComponent` + `AdminHeaderComponent` + `AdminUsersComponent` + `AdminService` + Edge Function `admin-users`. Nav del admin desde `admin-header.config.ts`. Redirect a `/euros` al cerrar sesión via `effect()`. Sidebar filtra item admin con flag `adminOnly`. |
| 2026-04-18 | **GlobalErrorHandler**: `core/services/global-error-handler.service.ts` implementa `ErrorHandler` de Angular. Registrado en `app.config.ts`. Extrae mensaje real del error (status 0 → conexión, body.error, body.message, e.message, fallback genérico). Todos los componentes inyectan `ErrorHandler` y llaman `handleError(e)` en `error:` callbacks y `catch` blocks. Patrón documentado en CONTEXT.md como obligatorio para nuevos módulos. |
| 2026-04-18 | **Unificación de badges**: `coin-badge`, `role-badge` y `unit-badge` reemplazados por un único `BadgeComponent` (presentación pura: label, severity, size, tooltip). Mapeo extraído a `shared/helpers/badge.helpers.ts` (`getConservationBadge`, `getUdsBadge`, `getRoleBadge`). Tipo `Severity` en `shared/interfaces/severity.interface.ts`. Consumidores (`coin-detail`, `euros-year-coins`, `admin-users`) precomputan `BadgeData` en signals para no llamar funciones desde template. |
| 2026-04-19 | **Flujo forgot/recovery password**: `LoginDialogComponent` con vista `'forgot'` (signal interno `view`), `RecoveryPasswordDialogComponent` global en `AppComponent`, `AuthService` con `isRecoveryMode`, `resetPassword()` y `updatePassword()`. Redirect a `/euros` tras logout. |
| 2026-04-19 | **Admin tabla**: cabecera deep-navy/cream, columnas centradas, fondo `background-admin.png`. Eliminar usuario con confirmación via modo `'delete'` en `AdminUserDialogComponent`. |
| 2026-04-19 | **euros-year-coins**: botón `pi-plus-circle` ghost solo para admin. `stopPropagation` en `td` para evitar navegación al detalle. Sin funcionalidad aún. |
| 2026-04-19 | **Shared components `text-input` y `select`**: creados desde cero con SCSS propio. `text-input` soporta text/email/password/number con min/max. `select` envuelve `p-select` con `definePreset` para tokens de tema y `appendTo="body"`. Refactorizados `login-dialog`, `recovery-password-dialog` y `admin-user-dialog`. |
| 2026-04-19 | **`CoinUdsDialogComponent`**: modal para editar uds y estado de conservación desde euros-year-coins. Usa `app-text-input` (number) y `app-select` con `CONSERVATION_OPTIONS`. |
| 2026-04-19 | **Tooltip internalizado**: `app-button` y `app-badge` gestionan `pTooltip` internamente via input `tooltip`. Eliminado `TooltipModule` de componentes padre. |
| 2026-04-19 | **`app-textarea`**: nuevo shared component nativo estilizado. `CoinUdsDialogComponent` ampliado para editar también `observations`. |
| 2026-04-19 | **Vista "Todas" (`EurosAllCoinsComponent`)**: tabla con `rowGroupMode="subheader"` agrupada por año. Ruta `/euros/:country/all` antes de `:country/:year`. Card "Todas" en el mismo grid que los años. Back navigation desde detalle corregida navegando a `/euros/:country/all/:id`. Paginación `SupabaseService` corregida con `ORDER BY id`. |
| 2026-04-20 | **Shared component `app-toggle`**: envuelve `p-toggleswitch`. `CoinUdsDialogComponent` ampliado con campo `circulation` (boolean) via `app-toggle`. |

---

## Notas y decisiones técnicas

### Angular
- **No usar `NgModule`**: Todo standalone, provideX() en `app.config.ts`
- **Signals everywhere**: Estado reactivo con signals, no con RxJS subjects para UI local
- **RxJS sólo para**: operaciones Firestore (collectionData, docData) — usar `toSignal()` para convertir
- **Guard**: `authGuard` funcional con `inject(Auth)` — NO class-based guard

### PrimeNG
- Usar el nuevo sistema de temas (CSS variables, `definePreset`) de PrimeNG v18+
- Importar componentes individualmente en cada standalone component (ISP)

### Autenticación
- El login abre un `p-dialog` desde cualquier punto de la app. No existe página `/login` separada.
- Los botones de edición/borrado solo son visibles cuando `authService.isLoggedIn()` es `true`
- El guard protege operaciones, no rutas de visualización

### Literales (`shared/constants/literals.ts`)
- **Ningún texto** va hardcodeado en templates (`.html`) ni en servicios
- Estructura por secciones: `LITERALS.euros.title`, `LITERALS.shared.loading`, `LITERALS.auth.loginButton`, etc.
- Los `toast-messages.const.ts` importan sus textos desde `literals.ts`

### Imágenes
- Banderas: normalizar nombre del país → buscar en `/assets/flags/{nombre-normalizado}.png`
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
- `error.error.message` → body JSON de HttpErrorResponse (Supabase REST estándar)
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
- Un componente llama a Firestore directamente → pasar siempre por el servicio de feature
- Servicios de feature conocen PrimeNG → los toasts/modales son del componente
- Features importando de otras features → solo de `shared/` y `core/`
