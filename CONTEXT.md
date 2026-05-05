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

### Tabla: `peseta_type` (pendiente de crear)

Datos scrapeados de Numista (187 tipos de pesetas circulantes 1868–2001). Fichero fuente: `pesetas_circulantes.json` en la raíz del proyecto.

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

**Estadísticas del JSON (2026-04-27):** 187 tipos, 692 entradas de mintingYears, 187/187 descripciones anverso/reverso, 158/187 descripciones de canto, 133/187 comentarios, 1/187 fotos de canto.

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
│   │   │   │   └── conmemorativas-list/       # Lista agrupada por año, sin acciones
│   │   │   ├── services/
│   │   │   │   └── conmemorativas.service.ts  # getAll() filtrando commemorative=true
│   │   │   ├── conmemorativas.component.ts    # Shell del módulo (sin router-outlet)
│   │   │   └── conmemorativas.component.html  # Renderiza <app-conmemorativas-list />
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

## Estado actual

> **Última actualización:** 2026-05-05 (sesión 10)

### URL de producción
**https://coinsddlp.vercel.app** — deploy automático en cada push a `main` (Vercel, plan Hobby)

### Pendiente / Próximos pasos
1. **Secciones restantes** — estadísticas, ubicación

---

## Log de implementación (últimas sesiones)

| Fecha | Cambio |
|-------|--------|
| 2026-04-23 | **Conmemorativas**: módulo completo (solo lectura), agrupado por año asc, ordenado por país. Columna Ceca (150px), columna Álb/H/Pos solo admin. `maxWidth` input en `collection-layout`. Config en `conmemorativas.config.ts`. |
| 2026-04-24 | **Scripts Numista**: `match-numista-ids-regular.mjs` asignó idNum a 4425 monedas (247 tipos). Todos los regulares tienen idNum. 370 conmemorativas pendientes en `scripts/pending-idnum-2026-04-24.md`. |
| 2026-04-26 | **UX listados**: ellipsis en columna descripción de euros-year-coins. `search-state.helper.ts` con `sessionStorage` para persistir buscadores al navegar atrás (5 componentes). Conmemorativas: filas clickables con `?from=conmemorativas`, `coin-detail` ajusta backLink. |
| 2026-04-27 | **Scraping pesetas**: script Python extrajo 187 tipos de pesetas circulantes (1868–2001) de Numista → `pesetas_circulantes.json`. 692 entradas mintingYears. Numista currency ID peseta: `cu=142`. |
| 2026-04-28 | **Módulo pesetas completo**: tablas `peseta_type` (187) y `peseta` (525) en Supabase. `PesetasService` con join. Rutas: denominaciones, todas agrupadas, lista por `:faceValue`. Búsqueda en todos los listados. |
| 2026-04-30 | **Detalle peseta** (`PesetaDetailComponent`): ruta `/:faceValue/:id` antes de `/:faceValue`. `PesetasService.getById()`. Layout idéntico a `coin-detail` (imágenes, descripciones, features-box con 14 campos + tirada con `DecimalPipe`). Sin llamada Numista. Filas clickables en list y all. |
| 2026-05-05 | **Exportar Excel**: `ExcelExportService` en `shared/services/` con ExcelJS. Slot `[layout-actions]` en `CollectionLayoutComponent`. Botón "Exportar Excel" en `euros-year-coins`, `euros-all-coins` y `conmemorativas-list`. Cabeceras deep-navy con texto cream. Conmemorativas: una hoja por año. |

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
