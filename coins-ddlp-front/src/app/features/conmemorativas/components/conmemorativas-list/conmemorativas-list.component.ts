import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  ErrorHandler,
  inject,
  LOCALE_ID,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { formatNumber } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { Skeleton } from 'primeng/skeleton';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { CountryFlagComponent } from '../../../../shared/components/country-flag/country-flag.component';
import { ProgressStatComponent } from '../../../../shared/components/progress-stat/progress-stat.component';
import { FilterPillsComponent } from '../../../../shared/components/filter-pills/filter-pills.component';
import { ConmemorativasService } from '../../services/conmemorativas.service';
import { AuthService } from '../../../../core/services/auth.service';
import { OwnerService } from '../../../../core/services/owner.service';
import { EuroCoin } from '../../../../shared/interfaces/euro-coin.interface';
import { OwnerSlug } from '../../../../shared/interfaces/owner.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { OWNERSHIP_FILTER_OPTIONS } from '../../../../shared/constants/ownership-filter.config';
import { OWNER_FILTER_OPTIONS } from '../../../../shared/constants/owner-filter.config';
import { normalizeString } from '../../../../shared/helpers/normalize-strings.helper';
import {
  restoreSearchQuery,
  saveSearchQuery,
} from '../../../../shared/helpers/search-state.helper';
import { getConservationBadge, getUdsBadge } from '../../../../shared/helpers/badge.helpers';
import { ExcelExportService } from '../../../../shared/services/excel-export.service';
import {
  ALBUM_POSITIONS_PER_ROW,
  ALBUM_POSITIONS_PER_PAGE,
  ALBUM_POSITIONS_PER_ALBUM,
} from '../../conmemorativas.config';

interface AlbumLocation {
  album: number;
  page: number;
  position: string;
}

interface CoinRow {
  coin: EuroCoin;
  conservationBadge: ReturnType<typeof getConservationBadge>;
  udsBadge: ReturnType<typeof getUdsBadge>;
  conservationBadgeAlt: ReturnType<typeof getConservationBadge>;
  udsBadgeAlt: ReturnType<typeof getUdsBadge> | null;
  location: AlbumLocation;
}

interface YearGroup {
  year: number;
  rows: CoinRow[];
  owned: number;
}

const SEARCH_KEY = 'conmemorativas';

function computeLocation(index: number): AlbumLocation {
  const album = Math.floor(index / ALBUM_POSITIONS_PER_ALBUM) + 1;
  const withinAlbum = index % ALBUM_POSITIONS_PER_ALBUM;
  const page = Math.floor(withinAlbum / ALBUM_POSITIONS_PER_PAGE) + 1;
  const withinPage = withinAlbum % ALBUM_POSITIONS_PER_PAGE;
  const row = Math.floor(withinPage / ALBUM_POSITIONS_PER_ROW) + 1;
  const col = (withinPage % ALBUM_POSITIONS_PER_ROW) + 1;
  return { album, page, position: `${row}.${col}` };
}

/** Orden físico del álbum: año, país, ceca y descripción. */
function albumOrder(a: EuroCoin, b: EuroCoin): number {
  return (
    a.year - b.year ||
    a.country.localeCompare(b.country, 'es') ||
    (a.mint ?? '').localeCompare(b.mint ?? '') ||
    a.description.localeCompare(b.description, 'es')
  );
}

@Component({
  selector: 'app-conmemorativas-list',
  imports: [
    TableModule,
    Skeleton,
    PageLayoutComponent,
    BadgeComponent,
    ButtonComponent,
    EmptyPanelComponent,
    CountryFlagComponent,
    ProgressStatComponent,
    FilterPillsComponent,
  ],
  templateUrl: './conmemorativas-list.component.html',
  styleUrl: './conmemorativas-list.component.scss',
})
export class ConmemorativasListComponent {
  private service = inject(ConmemorativasService);
  private excelExport = inject(ExcelExportService);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandler);
  private authService = inject(AuthService);
  private locale = inject(LOCALE_ID);
  readonly ownerService = inject(OwnerService);

  readonly isAdmin = this.authService.isAdmin;
  readonly literals = LITERALS.conmemorativas;
  readonly sharedLiterals = LITERALS.shared;
  readonly ownershipOptions = OWNERSHIP_FILTER_OPTIONS;
  readonly ownerOptions = OWNER_FILTER_OPTIONS;
  readonly skeletonRows = Array.from({ length: 6 });

  private allCoins = signal<EuroCoin[]>([]);
  readonly searchQuery = signal(restoreSearchQuery(SEARCH_KEY));
  readonly ownershipFilter = signal('all');
  readonly isReady = signal(false);
  readonly hasError = signal(false);

  /** Año cuya sección está en la parte alta de la pantalla (chip resaltado). */
  readonly currentYear = signal<number | null>(null);
  private readonly sectionsHost = viewChild<ElementRef<HTMLElement>>('sections');
  private readonly jumpsNav = viewChild<ElementRef<HTMLElement>>('jumpsNav');
  private observer: IntersectionObserver | null = null;

  readonly isBoth = computed(() => this.ownerService.current() === 'both');

  constructor() {
    effect(() => {
      this.ownerService.current();
      untracked(() => this.loadCoins());
    });

    // Tras pintar unos grupos nuevos, vuelve a observar sus cabeceras de año
    afterRenderEffect(() => {
      this.groupedCoins();
      this.observeSections();
    });

    // Mantiene visible el chip del año actual (en móvil la fila hace scroll horizontal)
    afterRenderEffect(() => {
      this.currentYear();
      const nav = this.jumpsNav()?.nativeElement;
      const active = nav?.querySelector<HTMLElement>('.year-jump--active');
      if (nav && active) {
        nav.scrollTo({ left: active.offsetLeft - nav.clientWidth / 2 + active.clientWidth / 2 });
      }
    });

    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }

  loadCoins(): void {
    this.hasError.set(false);
    this.service.getAll().subscribe({
      next: (coins) => {
        this.allCoins.set(coins);
        this.isReady.set(true);
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        this.hasError.set(true);
        this.isReady.set(true);
      },
    });
  }

  private isOwned(c: EuroCoin): boolean {
    return this.isBoth() ? c.uds > 0 && (c.udsAlt ?? 0) > 0 : c.uds > 0;
  }

  /**
   * Ubicación en el álbum calculada sobre la lista COMPLETA en orden físico, para que
   * buscar o filtrar no cambie la posición mostrada de cada moneda.
   */
  private readonly locations = computed(() => {
    const byId = new Map<string, AlbumLocation>();
    [...this.allCoins()].sort(albumOrder).forEach((c, i) => byId.set(c.id, computeLocation(i)));
    return byId;
  });

  readonly groupedCoins = computed<YearGroup[]>(() => {
    const ownership = this.ownershipFilter();
    const both = this.isBoth();
    const query = normalizeString(this.searchQuery());
    const locations = this.locations();

    const filtered = [...this.allCoins()]
      .filter((c) => {
        if (ownership === 'owned') return this.isOwned(c);
        if (ownership === 'missing')
          return both ? c.uds === 0 && (c.udsAlt ?? 0) === 0 : c.uds === 0;
        return true;
      })
      .filter(
        (c) =>
          !query ||
          String(c.year).includes(query) ||
          normalizeString(c.country).includes(query) ||
          normalizeString(c.description).includes(query),
      )
      .sort(albumOrder);

    const byYear = new Map<number, YearGroup>();
    for (const coin of filtered) {
      const group = byYear.get(coin.year) ?? { year: coin.year, rows: [], owned: 0 };
      group.rows.push({
        coin,
        conservationBadge: getConservationBadge(coin.conservation),
        udsBadge: getUdsBadge(coin.uds),
        conservationBadgeAlt: coin.conservationAlt
          ? getConservationBadge(coin.conservationAlt)
          : null,
        udsBadgeAlt: coin.udsAlt !== undefined ? getUdsBadge(coin.udsAlt) : null,
        location: locations.get(coin.id)!,
      });
      if (this.isOwned(coin)) group.owned++;
      byYear.set(coin.year, group);
    }
    return [...byYear.values()];
  });

  readonly progress = computed(() => {
    const coins = this.allCoins();
    return { owned: coins.filter((c) => this.isOwned(c)).length, total: coins.length };
  });

  readonly subtitle = computed(() => {
    const coins = this.allCoins();
    if (coins.length === 0) return '';
    const years = coins.map((c) => c.year);
    const total = formatNumber(coins.length, this.locale, '1.0-0');
    return `${Math.min(...years)} — ${Math.max(...years)} · ${total} ${this.literals.coinsCount}`;
  });

  // --- Acciones ---

  onSearch(query: string): void {
    this.searchQuery.set(query);
    saveSearchQuery(SEARCH_KEY, query);
  }

  onOwnerChange(slug: string): void {
    this.ownerService.setOwner(slug as OwnerSlug);
  }

  jumpToYear(year: number): void {
    this.sectionsHost()
      ?.nativeElement.querySelector(`#year-${year}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  openCoin(coin: EuroCoin): void {
    this.router.navigate(['/euros', coin.country, 'moneda', coin.id], {
      queryParams: { year: coin.year, from: 'conmemorativas' },
    });
  }

  async exportExcel(): Promise<void> {
    await this.excelExport.exportConmemorativas(this.groupedCoins(), this.isAdmin(), this.isBoth());
  }

  /** Resalta el chip del año cuya cabecera está más arriba dentro de la pantalla. */
  private observeSections(): void {
    this.observer?.disconnect();
    const host = this.sectionsHost()?.nativeElement;
    if (!host) return;
    const visible = new Map<number, number>();
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const year = Number((e.target as HTMLElement).dataset['year']);
          if (e.isIntersecting) visible.set(year, e.boundingClientRect.top);
          else visible.delete(year);
        }
        const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0];
        if (top) this.currentYear.set(top[0]);
      },
      // Zona útil: por debajo de los chips fijos y de la cabecera de año
      { rootMargin: '-110px 0px -55% 0px' },
    );
    host.querySelectorAll<HTMLElement>('[data-year]').forEach((el) => this.observer!.observe(el));
  }
}
