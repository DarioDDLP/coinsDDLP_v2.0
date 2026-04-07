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
| Backend / DB | **Firebase Firestore** | NoSQL, tiempo real |
| Autenticación | **Firebase Auth** | Login con email/password |
| UI Components | **PrimeNG (última versión)** | Modales, toasts, tablas, dropdowns, spinners |
| Estilos | **SCSS** | Global theming + estilos por componente |
| Hosting | **Firebase Hosting** (opcional) | |

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

## Estructura de datos (Firestore)

### Colección: `euro`
```typescript
interface EuroCoin {
  id: string;           // ID de Firestore
  year: string;
  country: string;
  mint?: string;        // Ceca (identificador de la casa de moneda)
  faceValue: string;    // "1 Céntimo", "2 Euros", etc.
  description: string;  // Descripción / gobernante
  uds: string;          // Unidades en posesión ("0" = no tengo)
  conservation?: string;// Estado: FDC | SC | EBC | MBC | BC | RC | MC | ND
  commemorative?: string;
  idNum: string;        // ID en catálogo Numista
  observations?: string;
  circulation: boolean;  // true = moneda de circulación, false = coleccionista/conmemorativa
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
│   │   │   │   ├── euros-list/            # Listado con búsqueda y filtros
│   │   │   │   └── euros-detail/          # Detalle + modal de edición
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

---

## Firebase

### Proyecto Firebase
- **Project ID:** `coinsddlp-back` *(reutilizar el existente o crear uno nuevo)*
- **Auth:** Email/Password habilitado
- **Firestore:** Colección `euro` con los documentos de monedas

### Configuración en `app.config.ts`
```typescript
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

const firebaseConfig = {
  // ← Rellenar con credenciales reales del proyecto Firebase
  apiKey: '...',
  authDomain: '...',
  projectId: 'coinsddlp-back',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideRouter(routes),
    provideAnimationsAsync(),
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

> **Última actualización:** 2026-04-07

### Implementado
- [x] Fichero de contexto CONTEXT.md creado
- [x] Hook de actualización automática configurado (`.claude/settings.json`)
- [x] Proyecto Angular 21 inicializado (v21.2.7, standalone, SCSS, sin SSR)
- [x] Estructura de carpetas creada (core, features, shared con subcarpetas completas)
- [x] Firebase JS SDK instalado (sin @angular/fire — incompatible con Angular 21)
- [x] PrimeNG 21 + @primeng/themes instalados
- [x] @angular/animations instalado (requerido por provideAnimationsAsync)
- [x] Interfaces: `EuroCoin`, `ConservationState`, `AppUser`, `IAuthService`, `IEurosRepository`
- [x] Constantes: `LITERALS`, `CONSERVATION_STATES`, `CONSERVATION_MAP`, `TOAST_MESSAGES`, `COLLECTIONS`
- [x] Helper: `normalizeCountryName`, `getFlagPath`
- [x] Pipe: `EuroValuePipe` (standalone)
- [x] `AuthService` — signal + onAuthStateChanged, lazy getAuth()
- [x] `FirestoreService` — genérico, tipado, lazy getFirestore(), CollectionName type
- [x] `app.config.ts` — initializeApp() Firebase + provideRouter + provideAnimationsAsync + providePrimeNG (tema Aura)
- [x] `app.routes.ts` — rutas raíz con lazy loading, redirect `/` → `/euros`, wildcard → `/euros`
- [x] Layout raíz — `app.ts` con SidebarComponent + router-outlet, fondo en body (global)
- [x] `SidebarComponent` — glassmorphism, azul marino #1e3a5f, items desde sidebar.config.ts con LITERALS
- [x] Assets en `public/assets/` (background.jpg, logo, banderas, iconos)
- [ ] Shared components: coin-badge, country-flag, loading-spinner ← **SIGUIENTE PASO**
- [ ] `euros.service.ts` implementando IEurosRepository
- [ ] Auth guard
- [ ] Euros list + detail
- [ ] Sección conmemorativas, pesetas, estadísticas, ubicación

### Pendiente / Próximos pasos
1. **Shared components** — coin-badge, country-flag, loading-spinner
2. **`euros.service.ts`** — implementa IEurosRepository usando FirestoreService
3. **Auth guard** — funcional con inject(AuthService)
4. **Euros list + detail** — componentes de la feature
5. **Secciones restantes** — conmemorativas, pesetas, estadísticas, ubicación

---

## Log de implementación

| Fecha | Cambio |
|-------|--------|
| 2026-04-06 | Proyecto iniciado. CONTEXT.md y hook creados. |
| 2026-04-06 | Arquitectura refactorizada: SOLID explícito, carpeta `shared/components/` genéricos, `shared/constants/literals.ts`, regla de dependencias entre capas, anti-patterns prohibidos. |
| 2026-04-06 | Proyecto Angular 21 creado. Firebase JS SDK + PrimeNG 21 instalados (@angular/fire incompatible con Angular 21). |
| 2026-04-06 | Capa de fundación completa: interfaces, constantes, helpers, pipe, AuthService y FirestoreService. Decisiones: year/uds como number, ConservationCode union type, AppUser agnóstico de Firebase, Observable para lecturas / Promise para escrituras, lazy getters para Firebase, CollectionName type para evitar magic strings. |
| 2026-04-07 | app.config.ts, app.routes.ts y layout raíz. SidebarComponent con glassmorphism y azul marino. Assets en public/assets/. @primeng/themes y @angular/animations instalados. Login es p-dialog, no ruta separada. |

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

### Lo que NO se hace (anti-patterns prohibidos)
- `*ngIf` / `*ngFor` → usar `@if` / `@for`
- Constructor injection → usar `inject()`
- `BehaviorSubject` para estado de UI → usar `signal()`
- Texto hardcodeado → importar de `literals.ts`
- Un componente llama a Firestore directamente → pasar siempre por el servicio de feature
- Servicios de feature conocen PrimeNG → los toasts/modales son del componente
- Features importando de otras features → solo de `shared/` y `core/`
