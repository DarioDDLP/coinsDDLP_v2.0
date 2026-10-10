import { Injectable, computed, inject, signal } from '@angular/core';
import { SUPABASE_CLIENT } from '../../app.config';
import { Owner, OwnerSelection } from '../../shared/interfaces/owner.interface';
import { ComparedNames } from '../../shared/interfaces/owned-count.interface';
import { TABLES } from '../../shared/constants/collections.const';
import { AuthService } from './auth.service';
import { PermissionsService } from './permissions.service';

const SESSION_KEY = 'owner_selection';

function readSelection(): OwnerSelection {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null');
    return {
      primary: typeof parsed?.primary === 'string' ? parsed.primary : null,
      compare: typeof parsed?.compare === 'string' ? parsed.compare : null,
    };
  } catch {
    return { primary: null, compare: null };
  }
}

/**
 * Colecciones de euros (tabla `owner`) y la que se está viendo: una principal y,
 * opcionalmente, otra con la que compararla (nunca más de dos a la vez).
 */
@Injectable({ providedIn: 'root' })
export class OwnerService {
  private supabase = inject(SUPABASE_CLIENT);
  private auth = inject(AuthService);
  private permissions = inject(PermissionsService);

  /** Colecciones ordenadas por nombre. */
  readonly owners = signal<Owner[]>([]);
  private readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  private pending: Promise<void> | null = null;

  private readonly selection = signal<OwnerSelection>(readSelection());

  private readonly defaultId = computed(() => {
    const owners = this.owners();
    return (owners.find((o) => o.isDefault) ?? owners[0])?.id ?? null;
  });

  /** Id de la colección propia del usuario con sesión (`null` si no tiene). */
  readonly ownId = computed(() => {
    const uid = this.auth.currentUser()?.uid;
    return uid && this.owners().some((o) => o.id === uid) ? uid : null;
  });

  private readonly canSwitch = computed(() => this.permissions.can('collection.switch'));

  /** Colección principal: la elegida › la propia › la por defecto. Sin `collection.switch`, la propia › la por defecto. */
  readonly primaryId = computed<string | null>(() => {
    const fixed = this.ownId() ?? this.defaultId();
    if (!this.canSwitch()) return fixed;
    const chosen = this.selection().primary;
    return chosen && this.exists(chosen) ? chosen : fixed;
  });

  /** Colección con la que se compara (`null` si no se compara). */
  readonly compareId = computed<string | null>(() => {
    if (!this.canSwitch()) return null;
    const chosen = this.selection().compare;
    return chosen && chosen !== this.primaryId() && this.exists(chosen) ? chosen : null;
  });

  readonly isComparing = computed(() => this.compareId() !== null);

  readonly primaryName = computed(() => this.nameOf(this.primaryId()));
  readonly compareName = computed(() => this.nameOf(this.compareId()));
  /** Nombres para el desglose por colección; `null` si no se compara. */
  readonly comparedNames = computed<ComparedNames>(() =>
    this.isComparing() ? { primary: this.primaryName(), compare: this.compareName() } : null,
  );

  /**
   * Cambia cuando cambia lo que se ve; `null` mientras cargan las colecciones o
   * los permisos (las vistas esperan). Si la carga de colecciones falla deja de ser
   * `null` y la vista intenta cargar: el error le llega vía `ensureLoaded()`.
   */
  readonly selectionKey = computed<string | null>(() => {
    if (this.status() === 'loading' || !this.permissions.loaded()) return null;
    return `${this.primaryId()}|${this.compareId()}`;
  });

  constructor() {
    void this.ensureLoaded().catch(() => undefined);
  }

  /** Resuelve cuando las colecciones están cargadas; si falló la carga, la reintenta. */
  ensureLoaded(): Promise<void> {
    if (this.status() === 'ready') return Promise.resolve();
    return (this.pending ??= this.fetch().finally(() => (this.pending = null)));
  }

  /** Vuelve a leer las colecciones (tras darlas o quitarlas en /admin). */
  async reload(): Promise<void> {
    await this.fetch();
  }

  setPrimary(id: string): void {
    const compare = this.selection().compare;
    this.save({ primary: id, compare: compare === id ? null : compare });
  }

  setCompare(id: string | null): void {
    this.save({ primary: this.primaryId(), compare: id });
  }

  private async fetch(): Promise<void> {
    const { data, error } = await this.supabase
      .from(TABLES.owner)
      .select('id, name, isDefault')
      .order('name');
    if (error) {
      if (this.status() !== 'ready') this.status.set('error');
      throw error;
    }
    this.owners.set((data ?? []) as Owner[]);
    this.status.set('ready');
  }

  private save(selection: OwnerSelection): void {
    this.selection.set(selection);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(selection));
  }

  private exists(id: string): boolean {
    return this.owners().some((o) => o.id === id);
  }

  private nameOf(id: string | null): string {
    return this.owners().find((o) => o.id === id)?.name ?? '';
  }
}
